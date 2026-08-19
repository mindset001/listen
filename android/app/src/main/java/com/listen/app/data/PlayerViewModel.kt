package com.listen.app.data

/**
 * listen — global player state, real audio via Media3 ExoPlayer
 * (port of ios/Listen/Stores/PlayerStore.swift)
 *
 * Mirrors web/components/AudioEngine.js exactly: one player, swapped to a
 * new segment's URL when playback crosses a segment boundary. `elapsed` is
 * segmentStartOffsets[currentSegmentIndex] + the player's own local time —
 * the provider gives no timestamps, so sentence highlighting still rides on
 * the word-count estimate in Timing.kt regardless of how the audio itself
 * is played. ExoPlayer has no periodic "time update" callback the way
 * AVPlayer does, so a 100ms polling loop stands in for it.
 */

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.listen.app.network.ApiConfig
import com.listen.app.models.AudioSegment
import com.listen.app.models.Document
import com.listen.app.services.SentenceTiming
import com.listen.app.services.Timing
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

data class PlaybackSwitches(
    val autoContinue: Boolean = true,
    val followText: Boolean = true,
    val resume: Boolean = true,
    val wifiOnly: Boolean = false,
)

sealed class GenerateException(message: String?) : Exception(message) {
    /** Silent no-op, matches README "already generating -> no-op". */
    object AlreadyGenerating : GenerateException(null)
    object Empty : GenerateException("Add some text before generating audio.")
    object TooLong : GenerateException("That is over the 20,000 character limit for one document.")
}

private const val FONT_MIN = 14
private const val FONT_MAX = 26
private const val FONT_STEP = 2
private const val LH_MIN = 1.4
private const val LH_MAX = 2.2
private const val LH_STEP = 0.2
private val MEASURE_STEPS = listOf(0.72, 0.86, 1.0)
private const val PROGRESS_SAVE_INTERVAL_MS = 5000L

class PlayerViewModel(application: Application) : AndroidViewModel(application) {
    private var library: LibraryViewModel? = null
    fun attachLibrary(lib: LibraryViewModel) { library = lib }

    private val _playing = MutableStateFlow(false)
    val playing: StateFlow<Boolean> = _playing.asStateFlow()

    private val _elapsed = MutableStateFlow(0.0)
    val elapsed: StateFlow<Double> = _elapsed.asStateFlow()

    private val _speed = MutableStateFlow(1.0)
    val speed: StateFlow<Double> = _speed.asStateFlow()

    private val _voice = MutableStateFlow("nova")
    val voice: StateFlow<String> = _voice.asStateFlow()

    private val _tone = MutableStateFlow("Professional")
    val tone: StateFlow<String> = _tone.asStateFlow()

    private val _currentDocId = MutableStateFlow<String?>(null)
    val currentDocId: StateFlow<String?> = _currentDocId.asStateFlow()

    private val _currentDocTitle = MutableStateFlow<String?>(null)
    val currentDocTitle: StateFlow<String?> = _currentDocTitle.asStateFlow()

    private val _hasAudio = MutableStateFlow(false)
    val hasAudio: StateFlow<Boolean> = _hasAudio.asStateFlow()

    private val _currentSegmentIndex = MutableStateFlow(0)
    val currentSegmentIndex: StateFlow<Int> = _currentSegmentIndex.asStateFlow()

    private val _segments = MutableStateFlow<List<AudioSegment>>(emptyList())
    val segments: StateFlow<List<AudioSegment>> = _segments.asStateFlow()

    private val _timing = MutableStateFlow(SentenceTiming.empty)
    val timing: StateFlow<SentenceTiming> = _timing.asStateFlow()

    val segment: Int get() = _currentSegmentIndex.value + 1
    val totalSegments: Int get() = maxOf(1, _segments.value.size)

    private val _fontSize = MutableStateFlow(16)
    val fontSize: StateFlow<Int> = _fontSize.asStateFlow()

    private val _lineHeight = MutableStateFlow(1.6)
    val lineHeight: StateFlow<Double> = _lineHeight.asStateFlow()

    private val _measure = MutableStateFlow(1.0)
    val measure: StateFlow<Double> = _measure.asStateFlow()

    private val _focus = MutableStateFlow(false)
    val focus: StateFlow<Boolean> = _focus.asStateFlow()

    private val _switches = MutableStateFlow(PlaybackSwitches())
    val switches: StateFlow<PlaybackSwitches> = _switches.asStateFlow()

    private val _generating = MutableStateFlow(false)
    val generating: StateFlow<Boolean> = _generating.asStateFlow()

    private val _genPct = MutableStateFlow(0.0)
    val genPct: StateFlow<Double> = _genPct.asStateFlow()

    private var segmentStartOffsets: List<Double> = emptyList()
    private var exoPlayer: ExoPlayer? = null
    private var pollingJob: Job? = null
    private var lastSavedAt = 0L

    /** Fetches the full document (list responses only carry a preview) and
     * loads it into the player. Auto-starts playback when audio exists —
     * matches the web store's `openDocument`. */
    suspend fun loadDocument(summary: Document) {
        val doc = runCatching { library?.fetchDetail(summary.id) }.getOrNull() ?: summary

        val sentences = Timing.splitSentences(doc.displayText)
        val t = SentenceTiming(sentences)
        _timing.value = t
        _currentDocId.value = doc.id
        _currentDocTitle.value = doc.title
        _segments.value = doc.segments ?: emptyList()
        _hasAudio.value = _segments.value.isNotEmpty()
        _voice.value = doc.voice ?: _voice.value
        _tone.value = doc.tone ?: _tone.value
        _speed.value = doc.speed ?: _speed.value

        var acc = 0.0
        segmentStartOffsets = _segments.value.map { seg -> acc.also { acc += seg.duration } }

        val resume = _switches.value.resume && doc.pct < 100
        val target = if (resume) minOf(doc.position ?: 0.0, t.total) else 0.0
        _currentSegmentIndex.value = segmentIndexAt(target)
        _elapsed.value = target
        _focus.value = false

        if (_hasAudio.value) {
            setupPlayer(target - segmentStartOffsets.getOrElse(_currentSegmentIndex.value) { 0.0 })
        } else {
            teardownPlayer()
        }
        _playing.value = _hasAudio.value
    }

    fun play() {
        if (!_hasAudio.value) return
        if (_elapsed.value >= _timing.value.total) seek(0.0)
        _playing.value = true
        applyRate()
    }

    fun pause() {
        _playing.value = false
        applyRate()
        persistProgress()
    }

    fun stop() {
        _playing.value = false
        seek(0.0)
        applyRate()
    }

    fun seek(value: Double) {
        val clamped = maxOf(0.0, minOf(_timing.value.total, value))
        val targetSegment = segmentIndexAt(clamped)
        val localTime = clamped - segmentStartOffsets.getOrElse(targetSegment) { 0.0 }

        if (targetSegment != _currentSegmentIndex.value) {
            _currentSegmentIndex.value = targetSegment
            setupPlayer(localTime)
        } else {
            exoPlayer?.seekTo((localTime * 1000).toLong())
        }
        _elapsed.value = clamped
    }

    fun seekToSentence(i: Int) = seek(_timing.value.startOf(i))

    fun next() {
        val i = _timing.value.indexAt(_elapsed.value)
        seek(_timing.value.startOf(i + 1))
    }

    fun prev() {
        val i = _timing.value.indexAt(_elapsed.value)
        seek(_timing.value.startOf(maxOf(0, i - 1)))
    }

    fun cycleSpeed() {
        _speed.value = Timing.nextSpeed(_speed.value)
        applyRate()
    }

    fun toggleFocus() { _focus.value = !_focus.value }
    fun incFontSize() { _fontSize.value = minOf(FONT_MAX, _fontSize.value + FONT_STEP) }
    fun decFontSize() { _fontSize.value = maxOf(FONT_MIN, _fontSize.value - FONT_STEP) }

    fun cycleLineHeight() {
        val next = _lineHeight.value + LH_STEP
        _lineHeight.value = if (next > LH_MAX + 0.001) LH_MIN else Math.round(next * 10) / 10.0
    }

    fun cycleMeasure() {
        val idx = MEASURE_STEPS.indexOf(_measure.value).let { if (it < 0) 0 else it }
        _measure.value = MEASURE_STEPS[(idx + 1) % MEASURE_STEPS.size]
    }

    fun toggleSwitch(mutate: (PlaybackSwitches) -> PlaybackSwitches) {
        _switches.value = mutate(_switches.value)
    }

    /** README "Generation flow": guard, validate, create the document, call
     * the real TTS provider, then load it (which auto-starts playback). The
     * provider gives no per-segment progress signal, so — matching the
     * original prototype and the web app — genPct is a synthetic tick
     * alongside the real request, not a measurement of it. */
    suspend fun generate(title: String, content: String, voice: String, speed: Double, tone: String): Document {
        if (_generating.value) throw GenerateException.AlreadyGenerating
        val text = content.trim()
        if (text.isEmpty()) throw GenerateException.Empty
        if (text.length > 20000) throw GenerateException.TooLong
        val lib = library ?: throw GenerateException.Empty

        _generating.value = true
        _genPct.value = 0.0
        val progressJob = viewModelScope.launch {
            while (isActive) {
                delay(130)
                _genPct.value = minOf(95.0, _genPct.value + 7)
            }
        }
        try {
            val created = lib.createDocument(title, text)
            val withAudio = lib.generateAudio(created.id, voice, speed, tone)
            _genPct.value = 100.0
            loadDocument(withAudio)
            return withAudio
        } finally {
            progressJob.cancel()
            _generating.value = false
            _genPct.value = 0.0
        }
    }

    // MARK: - ExoPlayer plumbing

    private fun setupPlayer(atLocalTime: Double) {
        teardownPlayer()
        val seg = _segments.value.getOrNull(_currentSegmentIndex.value) ?: return
        val url = ApiConfig.baseUrl + seg.url

        val player = ExoPlayer.Builder(getApplication()).build()
        player.setMediaItem(MediaItem.fromUri(url))
        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_ENDED) handleSegmentEnded()
            }
        })
        player.prepare()
        exoPlayer = player

        if (atLocalTime > 0.05) player.seekTo((atLocalTime * 1000).toLong())
        applyRate()
        startPolling()
    }

    private fun teardownPlayer() {
        pollingJob?.cancel()
        pollingJob = null
        exoPlayer?.release()
        exoPlayer = null
    }

    private fun applyRate() {
        val p = exoPlayer ?: return
        p.playWhenReady = _playing.value
        p.setPlaybackSpeed(_speed.value.toFloat())
    }

    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(100)
                val p = exoPlayer ?: continue
                if (_playing.value) handleTimeUpdate(p.currentPosition / 1000.0)
            }
        }
    }

    private fun segmentIndexAt(elapsed: Double): Int {
        var idx = 0
        for ((i, start) in segmentStartOffsets.withIndex()) if (elapsed >= start) idx = i
        return idx
    }

    private fun handleTimeUpdate(localTime: Double) {
        if (!_hasAudio.value) return
        val start = segmentStartOffsets.getOrElse(_currentSegmentIndex.value) { 0.0 }
        _elapsed.value = minOf(_timing.value.total, start + localTime)
        maybeSaveProgress()
    }

    private fun handleSegmentEnded() {
        persistProgress()
        advanceSegment()
    }

    private fun advanceSegment() {
        val nextIndex = _currentSegmentIndex.value + 1
        if (!_switches.value.autoContinue || nextIndex >= _segments.value.size) {
            _playing.value = false
            applyRate()
            return
        }
        _currentSegmentIndex.value = nextIndex
        _elapsed.value = segmentStartOffsets.getOrElse(nextIndex) { 0.0 }
        setupPlayer(0.0)
    }

    private fun maybeSaveProgress() {
        val now = System.currentTimeMillis()
        if (now - lastSavedAt < PROGRESS_SAVE_INTERVAL_MS) return
        lastSavedAt = now
        persistProgress()
    }

    private fun persistProgress() {
        val docId = _currentDocId.value ?: return
        val pct = _timing.value.progress(_elapsed.value) * 100
        val idx = _timing.value.indexAt(_elapsed.value)
        val pos = _elapsed.value
        viewModelScope.launch { library?.setProgress(docId, pos, pct, idx) }
    }

    override fun onCleared() {
        teardownPlayer()
        super.onCleared()
    }
}
