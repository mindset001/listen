//
//  APISmokeTests.swift
//  listen — exercises the real networking layer (APIClient/AuthStore/
//  LibraryStore/PlayerStore) against the live backend at APIConfig.baseURL.
//  Not a mocked unit test — `npm run dev` must be running. This is what
//  catches bugs curl-testing the backend directly can't: wrong Codable
//  field names, cookie handling, JSON shape mismatches.
//

import XCTest
@testable import Listen

@MainActor
final class APISmokeTests: XCTestCase {
    func testSignupDocumentGenerateAndCleanup() async throws {
        let auth = AuthStore()
        let library = LibraryStore()
        let player = PlayerStore(library: library)

        let email = "smoketest-\(Int(Date().timeIntervalSince1970))@example.com"

        // Signup
        try await auth.signup(name: "Smoke Test", email: email, password: "password123")
        XCTAssertEqual(auth.user?.email, email)
        XCTAssertEqual(auth.user?.hasPassword, true)

        // Session persists across a fresh /me check (cookie round-trip).
        await auth.refresh()
        XCTAssertEqual(auth.user?.email, email)

        // Voices
        await library.loadVoices()
        XCTAssertFalse(library.voices.isEmpty, "GET /api/voices returned no voices")

        // Fresh account starts with an empty library.
        await library.refresh()
        XCTAssertTrue(library.documents.isEmpty)

        // Create + generate real audio.
        let voiceId = library.voices[0].id
        let doc = try await player.generate(
            title: "Smoke test document",
            content: "This is a smoke test of the real backend from inside the iOS app. It checks that networking, decoding, and audio generation all actually work.",
            voice: voiceId, speed: 1, tone: "Professional"
        )
        XCTAssertEqual(player.currentDocId, doc.id)
        XCTAssertTrue(player.hasAudio, "generate() should produce at least one audio segment")
        XCTAssertGreaterThan(player.timing.total, 0)

        // The doc now appears in the library summary list too.
        await library.refresh()
        XCTAssertTrue(library.documents.contains { $0.id == doc.id })

        // Detail fetch round-trips full content + segments.
        let detail = try await library.fetchDetail(id: doc.id)
        XCTAssertFalse(detail.segments?.isEmpty ?? true)
        guard let segmentURLString = detail.segments?.first?.url,
              let segmentURL = URL(string: segmentURLString, relativeTo: APIConfig.baseURL) else {
            XCTFail("segment URL did not parse")
            return
        }
        let audioConfig = URLSessionConfiguration.default
        audioConfig.timeoutIntervalForRequest = 120
        let (audioData, response) = try await URLSession(configuration: audioConfig).data(from: segmentURL)
        XCTAssertEqual((response as? HTTPURLResponse)?.statusCode, 200)
        XCTAssertGreaterThan(audioData.count, 1000, "expected real MP3 bytes back from GridFS")

        // Favourite toggle round-trips.
        await library.toggleFavourite(id: doc.id)
        XCTAssertEqual(library.document(id: doc.id)?.fav, true)

        // Reading progress persists.
        await library.setProgress(id: doc.id, position: 5, percentage: 40, sentenceIndex: 1)
        let afterProgress = try await library.fetchDetail(id: doc.id)
        XCTAssertEqual(afterProgress.pct, 40)

        // Cleanup: delete the account, which cascades documents + audio.
        try await auth.deleteAccount(password: "password123")
        XCTAssertNil(auth.user)

        // The old session cookie is now invalid.
        await auth.refresh()
        XCTAssertNil(auth.user)
    }
}
