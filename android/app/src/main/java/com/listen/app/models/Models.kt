package com.listen.app.models

import kotlinx.serialization.Serializable

/** Matches toPublicUser() in web/lib/auth.js. */
@Serializable
data class User(
    val id: String,
    val name: String,
    val email: String,
    val hasPassword: Boolean,
)

/** Matches GET /api/voices' catalogue shape (web/lib/tts.js's getVoices()). */
@Serializable
data class Voice(
    val id: String,
    val name: String,
    val note: String,
    val lang: String,
)

/** Matches the segment shape in toDocumentDetail() in web/lib/documents.js. */
@Serializable
data class AudioSegment(
    val id: String,
    val segmentIndex: Int,
    val voice: String,
    val speed: Double,
    val url: String,
    val duration: Double,
)

/**
 * Matches toDocumentSummary() / toDocumentDetail() in web/lib/documents.js.
 * The list endpoint (GET /api/documents) only fills the summary fields —
 * `preview` is a truncated snippet there, and `content` is absent. The
 * detail endpoint (GET /api/documents/:id) fills everything, including the
 * real `content` and `segments`.
 */
@Serializable
data class Document(
    val id: String,
    val title: String,
    val preview: String,
    val pct: Int,
    val duration: String,
    val date: String,
    val audio: Boolean,
    val voice: String? = null,
    val speed: Double? = null,
    val tone: String? = null,
    val tag: String,
    val fav: Boolean,
    // Detail-only
    val content: String? = null,
    val wordCount: Int? = null,
    val charCount: Int? = null,
    val position: Double? = null,
    val sentenceIndex: Int? = null,
    val segments: List<AudioSegment>? = null,
) {
    /** Full text once a detail fetch has happened; falls back to the list
     * preview otherwise — safe to use in any context that just wants "some
     * representative text" (library cards, search). */
    val displayText: String get() = content ?: preview
}
