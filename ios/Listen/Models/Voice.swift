import Foundation

struct Voice: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var note: String
    var lang: String
}
