//
//  Timing.swift
//  listen — sentence timing model (port of lib/timing.js)
//
//  The prototype estimates sentence durations from word count. Everything
//  that needs to know "which sentence is playing" goes through this file,
//  so real provider timestamps can replace the estimate without touching
//  any screen.
//

import Foundation

enum Timing {
    static let wordsPerMinute: Double = 165
    static let minSentenceSeconds: Double = 1.6
    static let speeds: [Double] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

    /// Split a block of text into sentences, keeping terminal punctuation.
    static func splitSentences(_ text: String) -> [String] {
        let collapsed = text
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !collapsed.isEmpty else { return [] }

        let pattern = "(?<=[.!?])\\s+(?=[A-Z\"'\u{201C}])"
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [collapsed] }

        let ns = collapsed as NSString
        var result: [String] = []
        var lastEnd = 0
        regex.enumerateMatches(in: collapsed, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
            guard let match else { return }
            result.append(ns.substring(with: NSRange(location: lastEnd, length: match.range.location - lastEnd)))
            lastEnd = match.range.location + match.range.length
        }
        let tail = ns.substring(from: lastEnd)
        if !tail.isEmpty { result.append(tail) }
        return result.filter { !$0.isEmpty }
    }

    static func wordCount(_ text: String) -> Int {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return 0 }
        return t.split(whereSeparator: { $0.isWhitespace }).count
    }

    /// mm:ss — pair with monospaced numerals wherever it renders.
    static func formatTime(_ seconds: Double) -> String {
        let t = max(0, Int(seconds.rounded()))
        return String(format: "%02d:%02d", t / 60, t % 60)
    }

    static func nextSpeed(_ current: Double) -> Double {
        guard let idx = speeds.firstIndex(of: current) else { return current }
        return speeds[(idx + 1) % speeds.count]
    }

    /// Split a document for a provider character limit: paragraphs first,
    /// sentences only if a paragraph is still too long. Never send the whole thing.
    static func chunkDocument(_ text: String, limit: Int = 4000) -> [String] {
        let paragraphs = text
            .components(separatedBy: "\n\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        var chunks: [String] = []
        var buf = ""

        func flush() {
            let trimmed = buf.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty { chunks.append(trimmed) }
            buf = ""
        }

        for p in paragraphs {
            if p.count > limit {
                flush()
                var s = ""
                for sentence in splitSentences(p) {
                    if (s + " " + sentence).count > limit {
                        if !s.isEmpty { chunks.append(s.trimmingCharacters(in: .whitespacesAndNewlines)) }
                        s = sentence
                    } else {
                        s += (s.isEmpty ? "" : " ") + sentence
                    }
                }
                if !s.isEmpty { chunks.append(s.trimmingCharacters(in: .whitespacesAndNewlines)) }
            } else if (buf + "\n\n" + p).count > limit {
                flush()
                buf = p
            } else {
                buf += (buf.isEmpty ? "" : "\n\n") + p
            }
        }
        flush()
        return chunks
    }
}

/// Usage:
///   let t = SentenceTiming(sentences: sentences)                 // estimated
///   let t = SentenceTiming(sentences: sentences, timings: real)  // real timestamps
struct SentenceTiming {
    let sentences: [String]
    let durations: [Double]
    let total: Double
    let estimated: Bool
    private let starts: [Double]

    init(sentences: [String], timings: [(start: Double, end: Double)]? = nil) {
        self.sentences = sentences

        if let timings, timings.count == sentences.count {
            self.durations = timings.map { max(0.1, $0.end - $0.start) }
            self.estimated = false
        } else {
            self.durations = sentences.map {
                max(Timing.minSentenceSeconds, Double(Timing.wordCount($0)) / Timing.wordsPerMinute * 60)
            }
            self.estimated = true
        }

        var acc = 0.0
        var starts: [Double] = []
        for d in durations { starts.append(acc); acc += d }
        self.starts = starts
        self.total = acc
    }

    func startOf(_ i: Int) -> Double {
        guard !starts.isEmpty else { return 0 }
        return starts[max(0, min(starts.count - 1, i))]
    }

    func endOf(_ i: Int) -> Double {
        guard i >= 0, i < starts.count else { return 0 }
        return starts[i] + durations[i]
    }

    func indexAt(_ elapsed: Double) -> Int {
        for i in 0..<durations.count where elapsed < starts[i] + durations[i] {
            return i
        }
        return max(0, durations.count - 1)
    }

    func progress(_ elapsed: Double) -> Double {
        guard total > 0 else { return 0 }
        return min(1, max(0, elapsed / total))
    }
}
