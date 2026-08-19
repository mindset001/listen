//
//  MockData.swift
//  listen — decorative content with no backend endpoint
//
//  Voices come from GET /api/voices (see LibraryStore.loadVoices) and
//  documents from GET /api/documents — both real now. Tones have no
//  backend endpoint (matches web parity: web/lib/data.js's TONES is the
//  same static frontend constant), so it stays here.
//

import Foundation

enum MockData {
    static let tones = ["Professional", "Friendly", "Calm", "Energetic", "Storytelling", "Educational"]
}
