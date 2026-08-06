//
//  MockData.swift
//  listen — mock catalogue + seed library (port of lib/mock-data.js)
//
//  Placeholder for GET /api/voices and the documents table until a real
//  backend exists. Shape matches the README's API contract so swapping in
//  a real fetch later is a one-file change (see LibraryStore/PlayerStore).
//

import Foundation

enum MockData {
    static let voices: [Voice] = [
        Voice(id: "nova", name: "Nova Premium", note: "Warm, neutral", lang: "en-US"),
        Voice(id: "onyx", name: "Onyx Premium", note: "Low, unhurried", lang: "en-US"),
        Voice(id: "shimmer", name: "Shimmer Premium", note: "Bright, quick", lang: "en-US"),
        Voice(id: "echo", name: "Echo Premium", note: "Even, formal", lang: "en-US"),
    ]

    static let tones = ["Professional", "Friendly", "Calm", "Energetic", "Storytelling", "Educational"]

    struct Stats {
        static let documents = 14
        static let listeningTime = "6h 42m"
        static let completed = 9
        static let pagesRead = 128
    }

    static let chartData: [Double] = [12, 26, 0, 18, 34, 41, 22, 8, 0, 29, 47, 38, 55, 31]

    private static let seedText = """
    The city had a way of going quiet just before dawn, as if it were gathering itself for the day ahead. Streetlights held their orange glow a little longer than necessary, reluctant to give way to the pale blue creeping over the rooftops. A single delivery truck idled at the corner, its engine the only sound for blocks.

    She had always liked this hour best. Not because it was peaceful, exactly, but because it belonged to no one in particular. The commuters were still asleep. The night shift had gone home. For twenty minutes or so, the streets were simply hers to walk through, unclaimed and unhurried.

    By the time the first commuter trains rattled past, the spell would break, and the city would remember what it was for.
    """

    static func seedDocuments() -> [Document] {
        let now = Date()
        func daysAgo(_ n: Double) -> Date { now.addingTimeInterval(-n * 86400) }

        return [
            Document(
                id: "doc-1", title: "The Hour Before Dawn", content: seedText,
                voice: "nova", tone: "Calm", speed: 1, favourite: true,
                percentage: 62, sentenceIndex: 2, elapsed: 24, duration: "8m 12s",
                updatedLabel: "Today", createdAt: daysAgo(4), updatedAt: now
            ),
            Document(
                id: "doc-2", title: "Notes on Long-Distance Running",
                content: """
                Pacing is a conversation you have with your own body, one mile at a time. Most runners go out too fast, not because they lack discipline, but because the first mile always feels easy. It is the seventeenth mile that tells the truth.

                A good training plan respects boredom. The unglamorous long run, repeated week after week, is what actually builds the aerobic base — not the occasional heroic effort.
                """,
                voice: "onyx", tone: "Educational", speed: 1.25, favourite: false,
                percentage: 18, sentenceIndex: 1, elapsed: 6, duration: "5m 40s",
                updatedLabel: "Yesterday", createdAt: daysAgo(6), updatedAt: daysAgo(1)
            ),
            Document(
                id: "doc-3", title: "Letter to a New Engineer",
                content: """
                You will be tempted, in your first few months, to prove yourself by moving fast and touching everything. Resist it. The engineers people trust are not the ones who ship the most — they are the ones whose changes nobody has to double-check.

                Ask more questions than feels comfortable. The senior people on your team have already forgotten which parts of the system are confusing to a newcomer; your questions are the only signal they have left.
                """,
                voice: "echo", tone: "Professional", speed: 1, favourite: false,
                percentage: 100, sentenceIndex: 3, elapsed: 0, duration: "6m 05s",
                updatedLabel: "3 days ago", createdAt: daysAgo(16), updatedAt: daysAgo(4)
            ),
            Document(
                id: "doc-4", title: "A Short History of Tea",
                content: """
                Tea's journey from a medicinal curiosity in ancient China to the most consumed beverage in the world outside of water took the better part of two millennia. Its spread along trade routes reshaped economies, funded empires, and started at least one war.

                What began as boiled leaves in a Yunnan village eventually became a ritual precise enough to have its own philosophy in Japan and casual enough to be served from a cart in Mumbai.
                """,
                voice: "shimmer", tone: "Storytelling", speed: 1, favourite: false,
                percentage: 0, sentenceIndex: 0, elapsed: 0, duration: "7m 30s",
                updatedLabel: "1 week ago", createdAt: daysAgo(21), updatedAt: daysAgo(8)
            ),
        ]
    }
}
