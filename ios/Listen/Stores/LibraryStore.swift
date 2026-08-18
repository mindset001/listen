//
//  LibraryStore.swift
//  listen — document library, backed by web/app/api/documents/**
//

import Foundation
import Observation

@Observable
final class LibraryStore {
    private(set) var documents: [Document] = []
    private(set) var voices: [Voice] = []
    private(set) var isLoading = false

    func refresh() async {
        isLoading = true
        defer { isLoading = false }
        if let docs: [Document] = try? await APIClient.shared.request("/api/documents") {
            documents = docs
        }
    }

    func loadVoices() async {
        if let v: [Voice] = try? await APIClient.shared.request("/api/voices") {
            voices = v
        }
    }

    func document(id: String) -> Document? {
        documents.first { $0.id == id }
    }

    /// Full content + segments — the list only carries a preview.
    func fetchDetail(id: String) async throws -> Document {
        try await APIClient.shared.request("/api/documents/\(id)")
    }

    @discardableResult
    func createDocument(title: String, content: String, tag: String = "Document") async throws -> Document {
        struct Body: Encodable { let title: String; let content: String; let tag: String }
        let doc: Document = try await APIClient.shared.request(
            "/api/documents", method: "POST", body: Body(title: title, content: content, tag: tag)
        )
        documents.insert(doc, at: 0)
        return doc
    }

    @discardableResult
    func generateAudio(id: String, voice: String, speed: Double, tone: String) async throws -> Document {
        struct Body: Encodable { let voice: String; let speed: Double; let tone: String }
        let updated: Document = try await APIClient.shared.request(
            "/api/documents/\(id)/audio", method: "POST", body: Body(voice: voice, speed: speed, tone: tone)
        )
        replace(updated)
        return updated
    }

    func toggleFavourite(id: String) async {
        guard let idx = documents.firstIndex(where: { $0.id == id }) else { return }
        let newValue = !documents[idx].fav
        documents[idx].fav = newValue // optimistic

        struct Body: Encodable { let fav: Bool }
        do {
            let updated: Document = try await APIClient.shared.request(
                "/api/documents/\(id)", method: "PATCH", body: Body(fav: newValue)
            )
            replace(updated)
        } catch {
            if let i = documents.firstIndex(where: { $0.id == id }) { documents[i].fav = !newValue }
        }
    }

    func rename(id: String, title: String) async {
        struct Body: Encodable { let title: String }
        if let updated: Document = try? await APIClient.shared.request(
            "/api/documents/\(id)", method: "PATCH", body: Body(title: title)
        ) {
            replace(updated)
        }
    }

    func delete(id: String) async {
        documents.removeAll { $0.id == id } // optimistic
        _ = try? await APIClient.shared.request("/api/documents/\(id)", method: "DELETE") as OKResponse
    }

    func setProgress(id: String, position: Double, percentage: Double, sentenceIndex: Int) async {
        struct Body: Encodable {
            let documentId: String
            let position: Double
            let percentage: Double
            let sentenceIndex: Int
        }
        _ = try? await APIClient.shared.request(
            "/api/reading-progress", method: "PUT",
            body: Body(documentId: id, position: position, percentage: percentage, sentenceIndex: sentenceIndex)
        ) as OKResponse

        if let idx = documents.firstIndex(where: { $0.id == id }) {
            documents[idx].pct = Int(percentage.rounded())
            documents[idx].position = position
            documents[idx].sentenceIndex = sentenceIndex
        }
    }

    private func replace(_ doc: Document) {
        if let idx = documents.firstIndex(where: { $0.id == doc.id }) {
            documents[idx] = doc
        } else {
            documents.insert(doc, at: 0)
        }
    }
}
