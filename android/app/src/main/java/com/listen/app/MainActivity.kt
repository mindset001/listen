package com.listen.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import com.listen.app.designsystem.Theme
import com.listen.app.ui.navigation.ListenApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Theme.accent,
                    background = Theme.bgBase,
                    surface = Theme.bgElevated,
                    onBackground = Theme.fg1,
                    onSurface = Theme.fg1,
                ),
            ) {
                ListenApp()
            }
        }
    }
}
