import Foundation

struct Document: Identifiable, Codable, Equatable {
    var id: String
    var title: String
    var content: String
    var voice: String
    var tone: String
    var speed: Double
    var favourite: Bool
    var percentage: Int
    var sentenceIndex: Int
    var elapsed: Double
    var duration: String
    var updatedLabel: String
    var createdAt: Date
    var updatedAt: Date
}
