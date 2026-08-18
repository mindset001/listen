//
//  PlayerStore.swift
//  listen — global player store, real audio via AVPlayer
//
//  Mirrors web/components/AudioEngine.js exactly: one AVPlayer, swapped to
//  a new segment's URL when playback crosses a segment boundary. `elapsed`
//  is segmentStartOffsets[currentSegmentIndex] + the player's own local
//  time — the provider gives no timestamps, so sentence highlighting still
//  rides on the word-count estimate in Timing.swift regardless of how the
//  audio itself is played.
//

import Foundation
import Observation
import AVFoundation

struct PlaybackSwitches {
    var autoContinue = true
    var followText = true
    var resume = true
    var wifiOnly = false
}

enum GenerateError: LocalizedError {
    case alreadyGenerating
    case empty
    case tooLong

    var errorDescription: String? {
        switch self {
        case .alreadyGenerating: return nil // silent no-op, matches README "already generating -> no-op"
        case .empty: return "Add some text before generating audio."
        case .tooLong: return "That is over the 20,000 character limit for one document."
        }
    }
}

private let fontMin: CGFloat = 14, fontMax: CGFloat = 26, fontStep: CGFloat = 2
private let lhMin: CGFloat = 1.4, lhMax: CGFloat = 2.2, lhStep: CGFloat = 0.2
private let measureSteps: [CGFloat] = [0.72, 0.86, 1.0]
private let progressSaveInterval: TimeInterval = 5

@MainActor
@Observable
final class PlayerStore {
    // playback
    var playing = false {
        didSet { applyRate() }
    }
    var elapsed: Double = 0
    var speed: Double = 1 {
        didSet { applyRate() }
    }
    var voice = "nova"
    var tone = "Professional"
    var currentDocId: String?
    var currentDocTitle: String?
    var hasAudio = false
    var currentSegmentIndex = 0
    var segments: [AudioSegment] = []
    var timing = SentenceTiming(sentences: [])

    var segment: Int { currentSegmentIndex + 1 }
    var totalSegments: Int { max(1, segments.count) }

    // reading preferences
    var fontSize: CGFloat = 16
    var lineHeight: CGFloat = 1.6
    var measure: CGFloat = 1.0
    var focus = false

    var switches = PlaybackSwitches()

    // generation
    var generating = false
    var genPct: Double = 0

    private var segmentStartOffsets: [Double] = []
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var lastSavedAt = Date.distantPast
    private weak var library: LibraryStore?

    init(library: LibraryStore) {
        self.library = library
    }

    // No deinit cleanup: this store is only ever deallocated at app
    // termination (it's a root-level @State store), at which point ARC
    // releases the AVPlayer and its observers together — there's no
    // longer-lived owner for them to leak into.

    /// Fetches the full document (list responses only carry a preview) and
    /// loads it into the player. Auto-starts playback when audio exists —
    /// matches the web store's `openDocument`.
    func loadDocument(_ summary: Document) async {
        let doc = (try? await library?.fetchDetail(id: summary.id)) ?? summary

        let sentences = Timing.splitSentences(doc.displayText)
        timing = SentenceTiming(sentences: sentences)
        currentDocId = doc.id
        currentDocTitle = doc.title
        segments = doc.segments ?? []
        hasAudio = !segments.isEmpty
        voice = doc.voice ?? voice
        tone = doc.tone ?? tone
        speed = doc.speed ?? speed

        segmentStartOffsets = []
        var acc = 0.0
        for s in segments { segmentStartOffsets.append(acc); acc += s.duration }

        let resume = switches.resume && doc.pct < 100
        let target = resume ? min(doc.position ?? 0, timing.total) : 0
        currentSegmentIndex = segmentIndex(atElapsed: target)
        elapsed = target
        focus = false

        if hasAudio {
            setupPlayer(atLocalTime: target - (segmentStartOffsets[safe: currentSegmentIndex] ?? 0))
        } else {
            teardownPlayer()
        }
        playing = hasAudio
    }

    func play() {
        guard hasAudio else { return }
        if elapsed >= timing.total { seek(0) }
        playing = true
    }

    func pause() {
        playing = false
        persistProgress()
    }

    func stop() {
        playing = false
        seek(0)
    }

    func seek(_ value: Double) {
        let clamped = max(0, min(timing.total, value))
        let targetSegment = segmentIndex(atElapsed: clamped)
        let localTime = clamped - (segmentStartOffsets[safe: targetSegment] ?? 0)

        if targetSegment != currentSegmentIndex {
            currentSegmentIndex = targetSegment
            setupPlayer(atLocalTime: localTime)
        } else {
            player?.seek(to: CMTime(seconds: localTime, preferredTimescale: 600))
        }
        elapsed = clamped
    }

    func seekToSentence(_ i: Int) { seek(timing.startOf(i)) }

    func next() {
        let i = timing.indexAt(elapsed)
        seek(timing.startOf(i + 1))
    }

    func prev() {
        let i = timing.indexAt(elapsed)
        seek(timing.startOf(max(0, i - 1)))
    }

    func cycleSpeed() { speed = Timing.nextSpeed(speed) }

    func toggleFocus() { focus.toggle() }
    func incFontSize() { fontSize = min(fontMax, fontSize + fontStep) }
    func decFontSize() { fontSize = max(fontMin, fontSize - fontStep) }

    func cycleLineHeight() {
        let next = lineHeight + lhStep
        lineHeight = next > lhMax + 0.001 ? lhMin : (next * 10).rounded() / 10
    }

    func cycleMeasure() {
        let idx = measureSteps.firstIndex(of: measure) ?? 0
        measure = measureSteps[(idx + 1) % measureSteps.count]
    }

    func toggleSwitch(_ key: WritableKeyPath<PlaybackSwitches, Bool>) {
        switches[keyPath: key].toggle()
    }

    /// README "Generation flow": guard, validate, create the document, call
    /// the real TTS provider, then load it (which auto-starts playback).
    /// The provider gives no per-segment progress signal, so — matching the
    /// original prototype and the web app — genPct is a synthetic tick
    /// alongside the real request, not a measurement of it.
    func generate(title: String, content: String, voice: String, speed: Double, tone: String) async throws -> Document {
        guard !generating else { throw GenerateError.alreadyGenerating }
        let text = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { throw GenerateError.empty }
        guard text.count <= 20000 else { throw GenerateError.tooLong }

        guard let library else { throw GenerateError.empty }

        generating = true
        genPct = 0
        let progressTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 130_000_000)
                await MainActor.run { self?.genPct = min(95, (self?.genPct ?? 0) + 7) }
            }
        }
        defer {
            progressTask.cancel()
            generating = false
            genPct = 0
        }

        let created = try await library.createDocument(title: title, content: text)
        let withAudio = try await library.generateAudio(id: created.id, voice: voice, speed: speed, tone: tone)
        genPct = 100
        await loadDocument(withAudio)
        return withAudio
    }

    // MARK: - AVPlayer plumbing

    private func setupPlayer(atLocalTime localTime: Double) {
        teardownPlayer()
        guard let seg = segments[safe: currentSegmentIndex],
              let url = URL(string: seg.url, relativeTo: APIConfig.baseURL) else { return }

        let item = AVPlayerItem(url: url)
        let p = AVPlayer(playerItem: item)
        player = p

        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.handleSegmentEnded() }
        }
        timeObserver = p.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.1, preferredTimescale: 600), queue: .main
        ) { [weak self] time in
            Task { @MainActor in self?.handleTimeUpdate(CMTimeGetSeconds(time)) }
        }

        if localTime > 0.05 {
            p.seek(to: CMTime(seconds: localTime, preferredTimescale: 600))
        }
        applyRate()
    }

    private func teardownPlayer() {
        if let timeObserver, let player { player.removeTimeObserver(timeObserver) }
        timeObserver = nil
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        endObserver = nil
        player?.pause()
        player = nil
    }

    private func applyRate() {
        player?.rate = playing ? Float(speed) : 0
    }

    private func segmentIndex(atElapsed elapsed: Double) -> Int {
        var idx = 0
        for (i, start) in segmentStartOffsets.enumerated() where elapsed >= start { idx = i }
        return idx
    }

    private func handleTimeUpdate(_ localTime: Double) {
        guard hasAudio else { return }
        let start = segmentStartOffsets[safe: currentSegmentIndex] ?? 0
        elapsed = min(timing.total, start + localTime)
        if playing { maybeSaveProgress() }
    }

    private func handleSegmentEnded() {
        persistProgress()
        advanceSegment()
    }

    private func advanceSegment() {
        let nextIndex = currentSegmentIndex + 1
        guard switches.autoContinue, nextIndex < segments.count else {
            playing = false
            return
        }
        currentSegmentIndex = nextIndex
        elapsed = segmentStartOffsets[safe: nextIndex] ?? 0
        setupPlayer(atLocalTime: 0)
    }

    private func maybeSaveProgress() {
        guard Date().timeIntervalSince(lastSavedAt) > progressSaveInterval else { return }
        lastSavedAt = Date()
        persistProgress()
    }

    private func persistProgress() {
        guard let currentDocId else { return }
        let pct = timing.progress(elapsed) * 100
        let idx = timing.indexAt(elapsed)
        let pos = elapsed
        Task { [weak library] in
            await library?.setProgress(id: currentDocId, position: pos, percentage: pct, sentenceIndex: idx)
        }
    }
}
