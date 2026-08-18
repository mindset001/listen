import Foundation

/// Matches `toPublicUser()` in web/lib/auth.js.
struct User: Codable, Equatable {
    var id: String
    var name: String
    var email: String
    var hasPassword: Bool
}
