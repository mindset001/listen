//
//  AuthStore.swift
//  listen — real session state, backed by web/app/api/auth/**
//

import Foundation
import Observation

@Observable
final class AuthStore {
    private(set) var user: User?
    private(set) var checkedSession = false

    /// Call once on launch (and again after each splash) to find out
    /// whether the device already has a valid session cookie.
    func refresh() async {
        user = try? await APIClient.shared.request("/api/auth/me")
        checkedSession = true
    }

    func login(email: String, password: String) async throws {
        struct Body: Encodable { let email: String; let password: String }
        user = try await APIClient.shared.request("/api/auth/login", method: "POST", body: Body(email: email, password: password))
    }

    func signup(name: String, email: String, password: String) async throws {
        struct Body: Encodable { let name: String; let email: String; let password: String }
        user = try await APIClient.shared.request("/api/auth/signup", method: "POST", body: Body(name: name, email: email, password: password))
    }

    func logout() async {
        _ = try? await APIClient.shared.request("/api/auth/logout", method: "POST") as OKResponse
        user = nil
    }

    func updateProfile(name: String?, email: String?, currentPassword: String?) async throws {
        struct Body: Encodable { let name: String?; let email: String?; let currentPassword: String? }
        user = try await APIClient.shared.request(
            "/api/auth/profile", method: "PATCH",
            body: Body(name: name, email: email, currentPassword: currentPassword)
        )
    }

    func changePassword(currentPassword: String?, newPassword: String) async throws {
        struct Body: Encodable { let currentPassword: String?; let newPassword: String }
        user = try await APIClient.shared.request(
            "/api/auth/password", method: "POST",
            body: Body(currentPassword: currentPassword, newPassword: newPassword)
        )
    }

    func deleteAccount(password: String?) async throws {
        struct Body: Encodable { let password: String? }
        _ = try await APIClient.shared.request("/api/auth/me", method: "DELETE", body: Body(password: password)) as OKResponse
        user = nil
    }
}
