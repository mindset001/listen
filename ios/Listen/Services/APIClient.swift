//
//  APIClient.swift
//  listen — thin networking layer over the real backend (backend/app/api/**,
//  a standalone service — see backend/README or web/next.config.mjs's
//  rewrites() for how the web app reaches the same backend)
//
//  Sessions are cookie-based (see backend/lib/auth.js) — URLSession's default
//  configuration handles Set-Cookie/Cookie automatically via
//  HTTPCookieStorage, the same way a browser does, so no token plumbing
//  is needed here.
//

import Foundation

enum APIConfig {
    #if DEBUG
    /// The iOS Simulator shares the host Mac's network namespace, so
    /// "localhost" reaches the same `npm run dev` server (backend/, port
    /// 4000) the web app proxies to. A physical device needs the Mac's LAN
    /// IP instead — swap this one line, nothing else changes.
    static let baseURL = URL(string: "http://localhost:4000")!
    #else
    /// TODO: fill in once the backend is deployed — see backend/render.yaml.
    /// This is the standalone backend's own Render URL, not the web app's.
    static let baseURL = URL(string: "https://REPLACE-ME.onrender.com")!
    #endif
}

struct APIClientError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

private struct ErrorBody: Decodable {
    let error: String?
    let message: String?
}

private struct EmptyBody: Encodable {}

final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = .shared
        config.httpShouldSetCookies = true
        config.httpCookieAcceptPolicy = .always
        // TTS generation (POST /api/documents/:id/audio) calls a real
        // provider and can legitimately take a while — the default 60s
        // request timeout is too tight for that, even though it's fine
        // for everything else.
        config.timeoutIntervalForRequest = 120
        session = URLSession(configuration: config)

        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        encoder = JSONEncoder()
    }

    /// GET (or any body-less method).
    func request<T: Decodable>(_ path: String, method: String = "GET") async throws -> T {
        try await send(path, method: method, bodyData: nil)
    }

    /// Any method with a JSON body.
    func request<T: Decodable, B: Encodable>(_ path: String, method: String = "POST", body: B) async throws -> T {
        let data = try encoder.encode(body)
        return try await send(path, method: method, bodyData: data)
    }

    private func send<T: Decodable>(_ path: String, method: String, bodyData: Data?) async throws -> T {
        var req = URLRequest(url: APIConfig.baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = bodyData

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw APIClientError(message: "Check your connection and try again.")
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIClientError(message: "Something went wrong. Try again.")
        }

        guard (200...299).contains(http.statusCode) else {
            let body = try? decoder.decode(ErrorBody.self, from: data)
            throw APIClientError(message: body?.message ?? "Something went wrong (\(http.statusCode)).")
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError(message: "Got an unexpected response. Try again.")
        }
    }

    // MARK: - Multipart upload (POST /api/upload)

    func upload<T: Decodable>(_ path: String, fileData: Data, filename: String, mimeType: String) async throws -> T {
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: APIConfig.baseURL.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append(
            "Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n"
                .data(using: .utf8)!
        )
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.upload(for: req, from: body)
        } catch {
            throw APIClientError(message: "Check your connection and try again.")
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIClientError(message: "Something went wrong. Try again.")
        }
        guard (200...299).contains(http.statusCode) else {
            let errBody = try? decoder.decode(ErrorBody.self, from: data)
            throw APIClientError(message: errBody?.message ?? "Could not read that file.")
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError(message: "Got an unexpected response. Try again.")
        }
    }
}

/// A decoded `{ ok: true }` response — several endpoints return only this.
struct OKResponse: Decodable { let ok: Bool }

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
