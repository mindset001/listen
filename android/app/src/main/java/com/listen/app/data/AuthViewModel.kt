package com.listen.app.data

/**
 * listen — real session state, backed by the web/app/api/auth endpoints
 * (port of ios/Listen/Stores/AuthStore.swift)
 */

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.listen.app.ListenApplication
import com.listen.app.models.User
import com.listen.app.network.ApiClient
import com.listen.app.network.OkResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val api: ApiClient = (application as ListenApplication).apiClient

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    private val _checkedSession = MutableStateFlow(false)
    val checkedSession: StateFlow<Boolean> = _checkedSession.asStateFlow()

    /** Call once on launch to find out whether the device already has a
     * valid session cookie. */
    fun refresh() {
        viewModelScope.launch {
            _user.value = runCatching { api.get<User>("/api/auth/me") }.getOrNull()
            _checkedSession.value = true
        }
    }

    @Serializable
    private data class LoginBody(val email: String, val password: String)

    suspend fun login(email: String, password: String) {
        _user.value = api.post<LoginBody, User>("/api/auth/login", LoginBody(email, password))
    }

    @Serializable
    private data class SignupBody(val name: String, val email: String, val password: String)

    suspend fun signup(name: String, email: String, password: String) {
        _user.value = api.post<SignupBody, User>("/api/auth/signup", SignupBody(name, email, password))
    }

    suspend fun logout() {
        runCatching { api.post<OkResponse>("/api/auth/logout") }
        api.clearSession()
        _user.value = null
    }

    @Serializable
    private data class ProfileBody(val name: String?, val email: String?, val currentPassword: String?)

    suspend fun updateProfile(name: String?, email: String?, currentPassword: String?) {
        _user.value = api.patch<ProfileBody, User>(
            "/api/auth/profile", ProfileBody(name, email, currentPassword)
        )
    }

    @Serializable
    private data class PasswordBody(val currentPassword: String?, val newPassword: String)

    suspend fun changePassword(currentPassword: String?, newPassword: String) {
        _user.value = api.post<PasswordBody, User>(
            "/api/auth/password", PasswordBody(currentPassword, newPassword)
        )
    }

    @Serializable
    private data class DeleteBody(val password: String?)

    suspend fun deleteAccount(password: String?) {
        api.delete<DeleteBody, OkResponse>("/api/auth/me", DeleteBody(password))
        api.clearSession()
        _user.value = null
    }
}
