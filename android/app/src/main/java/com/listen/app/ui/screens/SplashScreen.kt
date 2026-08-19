package com.listen.app.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val barHeights = listOf(14, 42, 72, 42, 22)
private const val stepMs = 320L

private fun statusFor(step: Int): String = when {
    step <= 2 -> "Loading voices"
    step <= 4 -> "Restoring your place"
    else -> "Ready"
}

@Composable
fun SplashScreen(onFinish: () -> Unit) {
    var step by remember { mutableStateOf(0) }
    var navigated by remember { mutableStateOf(false) }
    val barProgress = remember { List(barHeights.size) { Animatable(0f) } }
    val wordmarkAlpha = remember { Animatable(0f) }

    fun finish() {
        if (navigated) return
        navigated = true
        onFinish()
    }

    LaunchedEffect(Unit) {
        barHeights.indices.forEach { i ->
            launch {
                delay(i * 80L)
                barProgress[i].animateTo(1f, tween(600))
            }
        }
        while (step < 6) {
            delay(stepMs)
            step += 1
            if (step == 4) wordmarkAlpha.animateTo(1f, tween(600))
        }
        delay(stepMs)
        finish()
    }

    val interactionSource = remember { MutableInteractionSource() }
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Theme.bgBase)
            .clickable(interactionSource = interactionSource, indication = null) { finish() },
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(20.dp)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(7.dp),
                verticalAlignment = Alignment.Bottom,
                modifier = Modifier.height(72.dp),
            ) {
                barHeights.forEachIndexed { i, h ->
                    val progress = barProgress[i].value
                    Box(
                        modifier = Modifier
                            .width(8.dp)
                            .height((8 + (h - 8) * progress).dp)
                            .alpha(0.25f + 0.75f * progress)
                            .background(
                                if (i == 2) Theme.accent else Theme.lineStrong,
                                RoundedCornerShape(4.dp),
                            ),
                    )
                }
            }

            Text(
                "listen",
                color = Theme.fg1,
                fontFamily = ListenFonts.interTight,
                fontSize = 40.sp,
                modifier = Modifier.alpha(wordmarkAlpha.value),
            )

            Text("Your reading list, out loud.", color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 16.sp)

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.padding(top = 24.dp),
            ) {
                Box(
                    modifier = Modifier
                        .width(140.dp)
                        .height(2.dp)
                        .background(Theme.lineQuiet, RoundedCornerShape(Theme.Radius.pill)),
                ) {
                    Box(
                        modifier = Modifier
                            .width((140 * minOf(1f, step * 0.2f)).dp)
                            .height(2.dp)
                            .background(Theme.accent, RoundedCornerShape(Theme.Radius.pill)),
                    )
                }
                Text(
                    statusFor(step).uppercase(),
                    color = Theme.fg3,
                    fontFamily = ListenFonts.inter,
                    fontSize = 12.sp,
                    letterSpacing = 0.96.sp,
                )
            }
        }
    }
}
