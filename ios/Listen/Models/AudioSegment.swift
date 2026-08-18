import Foundation

/// Matches the segment shape in `toDocumentDetail()` in web/lib/documents.js.
struct AudioSegment: Codable, Equatable, Identifiable {
    var id: String
    var segmentIndex: Int
    var voice: String
    var speed: Double
    var url: String
    var duration: Double
}
