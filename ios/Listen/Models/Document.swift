import Foundation

/// Matches `toDocumentSummary()` / `toDocumentDetail()` in web/lib/documents.js.
/// The list endpoint (GET /api/documents) only fills the summary fields —
/// `preview` is a truncated snippet there, and `content` is absent. The
/// detail endpoint (GET /api/documents/:id) fills everything, including
/// the real `content` and `segments`.
struct Document: Identifiable, Codable, Equatable {
    var id: String
    var title: String
    var preview: String
    var pct: Int
    var duration: String
    var date: String
    var audio: Bool
    var voice: String?
    var speed: Double?
    var tone: String?
    var tag: String
    var fav: Bool

    // Detail-only
    var content: String?
    var wordCount: Int?
    var charCount: Int?
    var position: Double?
    var sentenceIndex: Int?
    var segments: [AudioSegment]?

    /// Full text once a detail fetch has happened; falls back to the list
    /// preview otherwise — safe to use in any context that just wants
    /// "some representative text" (library cards, search).
    var displayText: String { content ?? preview }
}
