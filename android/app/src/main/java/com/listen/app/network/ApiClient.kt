package com.listen.app.network

/**
 * listen — thin networking layer over the real backend (the backend/app/api
 * endpoints, a standalone service — see web/next.config.mjs's rewrites()
 * for how the web app reaches the same backend)
 *
 * Sessions are cookie-based (see backend/lib/auth.js). OkHttp has no built-in
 * disk-persisted cookie jar (unlike iOS's HTTPCookieStorage, which persists
 * automatically) — PersistentCookieJar below backs it with SharedPreferences
 * so a session survives app restarts.
 */

import android.content.Context
import android.content.SharedPreferences
import com.listen.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.SerializationException
import kotlinx.serialization.serializer
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object ApiConfig {
    /** Set per build type in app/build.gradle.kts — debug points at the
     * local backend/ dev server (10.0.2.2:4000), release at the deployed
     * Render URL. */
    val baseUrl: String = BuildConfig.API_BASE_URL
}

class ApiException(val code: String?, message: String) : Exception(message)

@kotlinx.serialization.Serializable
@PublishedApi
internal data class ErrorBody(val error: String? = null, val message: String? = null)

/** A decoded `{ ok: true }` response — several endpoints return only this. */
@kotlinx.serialization.Serializable
data class OkResponse(val ok: Boolean)

private class PersistentCookieJar(context: Context) : CookieJar {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("listen_cookies", Context.MODE_PRIVATE)
    private val key = "session_cookie"

    @Synchronized
    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val session = cookies.firstOrNull { it.name == "listen_session" }
        if (session != null) {
            prefs.edit().putString(key, session.toString()).apply()
        }
    }

    @Synchronized
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val raw = prefs.getString(key, null) ?: return emptyList()
        val cookie = Cookie.parse(url, raw) ?: return emptyList()
        return listOf(cookie)
    }

    @Synchronized
    fun clear() {
        prefs.edit().remove(key).apply()
    }
}

class ApiClient(context: Context) {
    private val cookieJar = PersistentCookieJar(context.applicationContext)

    // inline reified send()/upload() below need to reach these across
    // module boundaries, so they can't stay plain `private`.
    @PublishedApi
    internal val client = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        // TTS generation calls a real provider and can legitimately take a
        // while — the OkHttp default (10s) is too tight for that, even
        // though it's fine for everything else.
        .callTimeout(120, TimeUnit.SECONDS)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .build()

    @PublishedApi
    internal val json = Json { ignoreUnknownKeys = true }

    fun clearSession() = cookieJar.clear()

    suspend inline fun <reified T> get(path: String): T =
        send(path, "GET", null)

    suspend inline fun <reified T> post(path: String): T =
        send(path, "POST", null)

    suspend inline fun <reified B, reified T> post(path: String, body: B): T =
        send(path, "POST", json.encodeToString(serializer<B>(), body))

    suspend inline fun <reified B, reified T> patch(path: String, body: B): T =
        send(path, "PATCH", json.encodeToString(serializer<B>(), body))

    suspend inline fun <reified B, reified T> put(path: String, body: B): T =
        send(path, "PUT", json.encodeToString(serializer<B>(), body))

    suspend inline fun <reified B, reified T> delete(path: String, body: B): T =
        send(path, "DELETE", json.encodeToString(serializer<B>(), body))

    suspend inline fun <reified T> delete(path: String): T =
        send(path, "DELETE", null)

    suspend inline fun <reified T> send(path: String, method: String, jsonBody: String?): T =
        withContext(Dispatchers.IO) {
            val requestBuilder = Request.Builder().url(ApiConfig.baseUrl + path)
            val body = jsonBody?.toRequestBody("application/json".toMediaType())
            when (method) {
                "GET" -> requestBuilder.get()
                "DELETE" -> if (body != null) requestBuilder.delete(body) else requestBuilder.delete()
                else -> requestBuilder.method(method, body ?: "".toRequestBody("application/json".toMediaType()))
            }

            val response = try {
                client.newCall(requestBuilder.build()).execute()
            } catch (e: Exception) {
                throw ApiException(null, "Check your connection and try again.")
            }

            response.use {
                val text = it.body?.string().orEmpty()
                if (!it.isSuccessful) {
                    val err = runCatching { json.decodeFromString<ErrorBody>(text) }.getOrNull()
                    throw ApiException(err?.error, err?.message ?: "Something went wrong (${it.code}).")
                }
                try {
                    json.decodeFromString(serializer<T>(), text)
                } catch (e: SerializationException) {
                    throw ApiException(null, "Got an unexpected response. Try again.")
                }
            }
        }

    /** Multipart upload — used by POST /api/upload. */
    suspend inline fun <reified T> upload(path: String, fileBytes: ByteArray, filename: String, mimeType: String): T =
        withContext(Dispatchers.IO) {
            val body = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart(
                    "file", filename,
                    fileBytes.toRequestBody(mimeType.toMediaType())
                )
                .build()

            val request = Request.Builder().url(ApiConfig.baseUrl + path).post(body).build()

            val response = try {
                client.newCall(request).execute()
            } catch (e: Exception) {
                throw ApiException(null, "Check your connection and try again.")
            }

            response.use {
                val text = it.body?.string().orEmpty()
                if (!it.isSuccessful) {
                    val err = runCatching { json.decodeFromString<ErrorBody>(text) }.getOrNull()
                    throw ApiException(err?.error, err?.message ?: "Could not read that file.")
                }
                try {
                    json.decodeFromString(serializer<T>(), text)
                } catch (e: SerializationException) {
                    throw ApiException(null, "Got an unexpected response. Try again.")
                }
            }
        }

    /** Streams raw bytes — used to download generated audio for local playback checks. */
    suspend fun getBytes(path: String): ByteArray = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(ApiConfig.baseUrl + path).get().build()
        client.newCall(request).execute().use {
            if (!it.isSuccessful) throw ApiException(null, "Could not download that file.")
            it.body?.bytes() ?: ByteArray(0)
        }
    }
}
