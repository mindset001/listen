package com.listen.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.listen.app.designsystem.Theme

/** value: 0..100 */
@Composable
fun ProgressBarView(value: Double, height: Dp = 3.dp, modifier: Modifier = Modifier) {
    val clamped = value.coerceIn(0.0, 100.0)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(RoundedCornerShape(Theme.Radius.pill))
            .background(Theme.lineQuiet),
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(fraction = (clamped / 100.0).toFloat())
                .clip(RoundedCornerShape(Theme.Radius.pill))
                .background(Theme.accent),
        )
    }
}
