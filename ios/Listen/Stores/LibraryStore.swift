//
//  LibraryStore.swift
//  listen — document library (mock persistence layer)
//
//  Stands in for the README's Document / Audio / ReadingProgress / Favourite
//  tables until a real backend exists. Persisted locally via UserDefaults so
//  "remember where you stopped" works across app relaunches. Swapping in a
//  real API means replacing the body of these methods — the shape (Document
//  record, percentage/sentenceIndex progress) already matches the API contract.
//

import Foundation
import Observation

@Observable
final class LibraryStore {
    private(set) var documents: [Document]
    private let defaultsKey = "listen-library"
    private var nextId = 5

    init() {
        if let data = UserDefaults.standard.data(forKey: "listen-library"),
           let decoded = try? JSONDecoder().decode([Document].self, from: data) {
            self.documents = decoded
        } else {
            self.documents = MockData.seedDocuments()
        }
    }

    func document(id: String) -> Document? {
        documents.first { $0.id == id }
    }

    @discardableResult
    func addDocument(title: String, content: String, voice: String, tone: String, speed: Double) -> Document {
        let doc = Document(
            id: "doc-\(nextId)", title: title.isEmpty ? "Untitled" : title, content: content,
            voice: voice, tone: tone, speed: speed, favourite: false,
            percentage: 0, sentenceIndex: 0, elapsed: 0, duration: "—",
            updatedLabel: "Today", createdAt: Date(), updatedAt: Date()
        )
        nextId += 1
        documents.insert(doc, at: 0)
        persist()
        return doc
    }

    func update(id: String, _ mutate: (inout Document) -> Void) {
        guard let idx = documents.firstIndex(where: { $0.id == id }) else { return }
        mutate(&documents[idx])
        documents[idx].updatedAt = Date()
        persist()
    }

    func delete(id: String) {
        documents.removeAll { $0.id == id }
        persist()
    }

    func rename(id: String, title: String) {
        update(id: id) { $0.title = title }
    }

    func toggleFavourite(id: String) {
        update(id: id) { $0.favourite.toggle() }
    }

    func setProgress(id: String, percentage: Double, sentenceIndex: Int, elapsed: Double) {
        update(id: id) {
            $0.percentage = Int(percentage.rounded())
            $0.sentenceIndex = sentenceIndex
            $0.elapsed = elapsed
            $0.updatedLabel = "Today"
        }
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(documents) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
    }
}
