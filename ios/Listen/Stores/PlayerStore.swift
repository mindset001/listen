//
//  PlayerStore.swift
//  listen — global player store
//
//  Holds the README's "Global (survives navigation)" state block and drives
//  playback with the same simulated 100ms tick the HTML prototype uses (no
//  real audio yet — see README "Playback (currently simulated)"). Swapping in
//  real audio later means replacing tick()/play()/pause() bodies; everything
//  that reads "which sentence is active" already goes through Timing.swift,
//  per the README's own module boundary.
//

import Foundation
import Observation

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

@Observable
final class PlayerStore {
    // playback
    var playing = false
    var elapsed: Double = 0
    var speed: Double = 1
    var voice = "nova"
    var tone = "Professional"
    var currentDocId: String?
    var currentDocTitle: String?
    var hasAudio = false
    var segment = 1
    var totalSegments = 1
    var timing = SentenceTiming(sentences: [])

    // reading preferences
    var fontSize: CGFloat = 16
    var lineHeight: CGFloat = 1.6
    var measure: CGFloat = 1.0
    var focus = false

    var switches = PlaybackSwitches()

    // generation
    var generating = false
    var genPct: Double = 0

    private var timer: Timer?
    private weak var library: LibraryStore?

    init(library: LibraryStore) {
        self.library = library
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    deinit { timer?.invalidate() }

    func loadDocument(_ doc: Document) {
        let sentences = Timing.splitSentences(doc.content)
        let t = SentenceTiming(sentences: sentences)
        currentDocId = doc.id
        currentDocTitle = doc.title
        hasAudio = true
        voice = doc.voice
        tone = doc.tone
        speed = doc.speed
        timing = t
        elapsed = switches.resume ? min(doc.elapsed, t.total) : 0
        segment = 1
        totalSegments = max(1, Timing.chunkDocument(doc.content, limit: 900).count)
        playing = false
    }

    func play() {
        guard hasAudio else { return }
        if elapsed >= timing.total { elapsed = 0 }
        playing = true
    }

    func pause() {
        playing = false
        persistProgress()
    }

    func stop() {
        playing = false
        elapsed = 0
    }

    func seek(_ value: Double) {
        elapsed = max(0, min(timing.total, value))
    }

    func seekToSentence(_ i: Int) {
        seek(timing.startOf(i))
    }

    func next() {
        let i = timing.indexAt(elapsed)
        seek(timing.startOf(i + 1))
    }

    func prev() {
        let i = timing.indexAt(elapsed)
        seek(timing.startOf(max(0, i - 1)))
    }

    func cycleSpeed() {
        speed = Timing.nextSpeed(speed)
    }

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

    /// README "Generation flow": guard, validate, fake progress, then caller navigates.
    @MainActor
    func generate(title: String, content: String, voice: String, speed: Double, tone: String) async throws -> Document {
        guard !generating else { throw GenerateError.alreadyGenerating }
        let text = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { throw GenerateError.empty }
        guard text.count <= 20000 else { throw GenerateError.tooLong }

        generating = true
        genPct = 0
        while genPct < 100 {
            try? await Task.sleep(nanoseconds: 130_000_000)
            genPct = min(100, genPct + 7)
        }
        generating = false
        genPct = 0

        guard let library else { throw GenerateError.empty }
        let doc = library.addDocument(title: title, content: text, voice: voice, tone: tone, speed: speed)
        loadDocument(doc)
        return doc
    }

    private func persistProgress() {
        guard let currentDocId else { return }
        library?.setProgress(
            id: currentDocId,
            percentage: timing.progress(elapsed) * 100,
            sentenceIndex: timing.indexAt(elapsed),
            elapsed: elapsed
        )
    }

    private func tick() {
        guard playing else { return }
        let next = elapsed + 0.1 * speed
        if next >= timing.total {
            elapsed = timing.total
            playing = false
            persistProgress()
        } else {
            elapsed = next
        }
    }
}
