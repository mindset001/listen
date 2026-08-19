package com.listen.app.data

/**
 * listen — document library, backed by the web/app/api/documents endpoints
 * (port of ios/Listen/Stores/LibraryStore.swift)
 */

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.listen.app.ListenApplication
import com.listen.app.models.Document
import com.listen.app.models.Voice
import com.listen.app.network.ApiClient
import com.listen.app.network.OkResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

class LibraryViewModel(application: Application) : AndroidViewModel(application) {
    private val api: ApiClient = (application as ListenApplication).apiClient

    private val _documents = MutableStateFlow<List<Document>>(emptyList())
    val documents: StateFlow<List<Document>> = _documents.asStateFlow()

    private val _voices = MutableStateFlow<List<Voice>>(emptyList())
    val voices: StateFlow<List<Voice>> = _voices.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun refresh() {
        viewModelScope.launch {
            _isLoading.value = true
            _documents.value = runCatching { api.get<List<Document>>("/api/documents") }
                .getOrDefault(_documents.value)
            _isLoading.value = false
        }
    }

    fun loadVoices() {
        viewModelScope.launch {
            _voices.value = runCatching { api.get<List<Voice>>("/api/voices") }.getOrDefault(emptyList())
        }
    }

    fun document(id: String): Document? = _documents.value.firstOrNull { it.id == id }

    /** Full content + segments — the list only carries a preview. */
    suspend fun fetchDetail(id: String): Document = api.get("/api/documents/$id")

    @Serializable
    private data class CreateBody(val title: String, val content: String, val tag: String = "Document")

    suspend fun createDocument(title: String, content: String, tag: String = "Document"): Document {
        val doc = api.post<CreateBody, Document>("/api/documents", CreateBody(title, content, tag))
        _documents.value = listOf(doc) + _documents.value
        return doc
    }

    @Serializable
    private data class GenerateBody(val voice: String, val speed: Double, val tone: String)

    suspend fun generateAudio(id: String, voice: String, speed: Double, tone: String): Document {
        val updated = api.post<GenerateBody, Document>(
            "/api/documents/$id/audio", GenerateBody(voice, speed, tone)
        )
        replace(updated)
        return updated
    }

    @Serializable
    private data class FavBody(val fav: Boolean)

    fun toggleFavourite(id: String) {
        val current = document(id) ?: return
        val newValue = !current.fav
        replace(current.copy(fav = newValue)) // optimistic

        viewModelScope.launch {
            try {
                val updated = api.patch<FavBody, Document>("/api/documents/$id", FavBody(newValue))
                replace(updated)
            } catch (e: Exception) {
                document(id)?.let { replace(it.copy(fav = !newValue)) }
            }
        }
    }

    @Serializable
    private data class RenameBody(val title: String)

    fun rename(id: String, title: String) {
        viewModelScope.launch {
            runCatching { api.patch<RenameBody, Document>("/api/documents/$id", RenameBody(title)) }
                .onSuccess { replace(it) }
        }
    }

    fun delete(id: String) {
        _documents.value = _documents.value.filter { it.id != id } // optimistic
        viewModelScope.launch {
            runCatching { api.delete<OkResponse>("/api/documents/$id") }
        }
    }

    @Serializable
    private data class ProgressBody(
        val documentId: String,
        val position: Double,
        val percentage: Double,
        val sentenceIndex: Int,
    )

    suspend fun setProgress(id: String, position: Double, percentage: Double, sentenceIndex: Int) {
        runCatching {
            api.put<ProgressBody, OkResponse>(
                "/api/reading-progress", ProgressBody(id, position, percentage, sentenceIndex)
            )
        }
        document(id)?.let {
            replace(it.copy(pct = Math.round(percentage).toInt(), position = position, sentenceIndex = sentenceIndex))
        }
    }

    private fun replace(doc: Document) {
        val idx = _documents.value.indexOfFirst { it.id == doc.id }
        _documents.value = if (idx >= 0) {
            _documents.value.toMutableList().also { it[idx] = doc }
        } else {
            listOf(doc) + _documents.value
        }
    }
}
