package com.listen.app.ui.components

/**
 * listen — bottom-anchored toasts (README "Toasts")
 * info -> info / lineStrong / fg2 · success -> check / success · error -> alert-triangle / caution
 * (port of ios/Listen/Components/ToastCenter.swift)
 */

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class ToastKind { INFO, SUCCESS, ERROR }

data class ToastMessage(val kind: ToastKind, val message: String, val token: Long = System.nanoTime())

class ToastCenter {
    var current by mutableStateOf<ToastMessage?>(null)
        private set
    private var dismissJob: Job? = null

    fun show(kind: ToastKind, message: String, scope: CoroutineScope) {
        dismissJob?.cancel()
        current = ToastMessage(kind, message)
        dismissJob = scope.launch {
            delay(3200)
            current = null
        }
    }
}

@Composable
fun ToastOverlay(toast: ToastMessage?) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
        AnimatedVisibility(
            visible = toast != null,
            enter = fadeIn() + slideInVertically(initialOffsetY = { it / 2 }),
            exit = fadeOut() + slideOutVertically(targetOffsetY = { it / 2 }),
            modifier = Modifier.padding(horizontal = Theme.Space.lg, vertical = 100.dp),
        ) {
            if (toast != null) {
                val (icon, color) = when (toast.kind) {
                    ToastKind.INFO -> IconName.Info to Theme.fg2
                    ToastKind.SUCCESS -> IconName.Check to Theme.success
                    ToastKind.ERROR -> IconName.AlertTriangle to Theme.caution
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Theme.Space.sm),
                    modifier = Modifier
                        .background(Theme.bgRaised, RoundedCornerShape(Theme.Radius.card))
                        .border(1.dp, color, RoundedCornerShape(Theme.Radius.card))
                        .padding(Theme.Space.base),
                ) {
                    AppIcon(icon, size = 16.dp, color = color)
                    Text(toast.message, color = Theme.fg1, fontSize = 13.sp, fontFamily = ListenFonts.inter)
                }
            }
        }
    }
}
