package com.listen.app

import android.app.Application
import com.listen.app.network.ApiClient

class ListenApplication : Application() {
    lateinit var apiClient: ApiClient
        private set

    override fun onCreate() {
        super.onCreate()
        apiClient = ApiClient(this)
    }
}
