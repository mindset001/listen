package com.listen.app.services

/**
 * listen — sentence timing model (port of lib/timing.js / Timing.swift)
 *
 * The prototype estimates sentence durations from word count. Everything
 * that needs to know "which sentence is playing" goes through this file,
 * so real provider timestamps can replace the estimate without touching
 * any screen.
 */
object Timing {
    const val wordsPerMinute = 165.0
    const val minSentenceSeconds = 1.6
    val speeds = listOf(0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0)

    private val sentenceBoundary = Regex("(?<=[.!?])\\s+(?=[A-Z\"'“])")

    /** Split a block of text into sentences, keeping terminal punctuation. */
    fun splitSentences(text: String): List<String> {
        val collapsed = text.replace(Regex("\\s+"), " ").trim()
        if (collapsed.isEmpty()) return emptyList()
        return collapsed.split(sentenceBoundary).filter { it.isNotEmpty() }
    }

    fun wordCount(text: String): Int {
        val t = text.trim()
        if (t.isEmpty()) return 0
        return t.split(Regex("\\s+")).size
    }

    /** mm:ss — pair with monospaced numerals wherever it renders. */
    fun formatTime(seconds: Double): String {
        val t = maxOf(0, Math.round(seconds).toInt())
        return "%02d:%02d".format(t / 60, t % 60)
    }

    fun nextSpeed(current: Double): Double {
        val idx = speeds.indexOf(current)
        if (idx == -1) return current
        return speeds[(idx + 1) % speeds.size]
    }

    /** Split a document for a provider character limit: paragraphs first,
     * sentences only if a paragraph is still too long. Never send the whole thing. */
    fun chunkDocument(text: String, limit: Int = 4000): List<String> {
        val paragraphs = text.split(Regex("\n\\s*\n")).map { it.trim() }.filter { it.isNotEmpty() }
        val chunks = mutableListOf<String>()
        var buf = ""

        fun flush() {
            if (buf.trim().isNotEmpty()) chunks.add(buf.trim())
            buf = ""
        }

        for (p in paragraphs) {
            if (p.length > limit) {
                flush()
                var s = ""
                for (sentence in splitSentences(p)) {
                    if ((s + " " + sentence).length > limit) {
                        if (s.isNotEmpty()) chunks.add(s.trim())
                        s = sentence
                    } else {
                        s += (if (s.isEmpty()) "" else " ") + sentence
                    }
                }
                if (s.isNotEmpty()) chunks.add(s.trim())
            } else if ((buf + "\n\n" + p).length > limit) {
                flush()
                buf = p
            } else {
                buf += (if (buf.isEmpty()) "" else "\n\n") + p
            }
        }
        flush()
        return chunks
    }
}

/**
 * Usage:
 *   val t = SentenceTiming(sentences)                 // estimated
 *   val t = SentenceTiming(sentences, timings)         // real timestamps
 */
class SentenceTiming(
    val sentences: List<String>,
    timings: List<Pair<Double, Double>>? = null,
) {
    val durations: List<Double>
    val total: Double
    val estimated: Boolean
    private val starts: List<Double>

    init {
        if (timings != null && timings.size == sentences.size) {
            durations = timings.map { maxOf(0.1, it.second - it.first) }
            estimated = false
        } else {
            durations = sentences.map {
                maxOf(Timing.minSentenceSeconds, Timing.wordCount(it) / Timing.wordsPerMinute * 60)
            }
            estimated = true
        }

        var acc = 0.0
        val s = mutableListOf<Double>()
        for (d in durations) { s.add(acc); acc += d }
        starts = s
        total = acc
    }

    fun startOf(i: Int): Double {
        if (starts.isEmpty()) return 0.0
        return starts[maxOf(0, minOf(starts.size - 1, i))]
    }

    fun endOf(i: Int): Double {
        if (i < 0 || i >= starts.size) return 0.0
        return starts[i] + durations[i]
    }

    fun indexAt(elapsed: Double): Int {
        for (i in durations.indices) {
            if (elapsed < starts[i] + durations[i]) return i
        }
        return maxOf(0, durations.size - 1)
    }

    fun progress(elapsed: Double): Double {
        if (total <= 0) return 0.0
        return minOf(1.0, maxOf(0.0, elapsed / total))
    }

    companion object {
        val empty = SentenceTiming(emptyList())
    }
}
