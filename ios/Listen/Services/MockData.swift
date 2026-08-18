//
//  MockData.swift
//  listen — decorative content with no backend endpoint
//
//  Voices come from GET /api/voices (see LibraryStore.loadVoices) and
//  documents from GET /api/documents — both real now. Tones and the
//  dashboard stats/chart have no backend endpoint (matches web parity:
//  web/lib/data.js's TONES/STATS/CHART are the same static frontend
//  constants), so they stay here.
//

import Foundation

enum MockData {
    static let tones = ["Professional", "Friendly", "Calm", "Energetic", "Storytelling", "Educational"]

    struct Stats {
        static let documents = 14
        static let listeningTime = "6h 42m"
        static let completed = 9
        static let pagesRead = 128
    }

    static let chartData: [Double] = [12, 26, 0, 18, 34, 41, 22, 8, 0, 29, 47, 38, 55, 31]
}
