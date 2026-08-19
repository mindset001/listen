package com.listen.app.ui.components

/**
 * listen — persistent bar above the tab bar while a document has audio
 * loaded (port of ios/Listen/Components/MiniPlayerView.swift).
 */

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.data.PlayerViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme

@Composable
fun MiniPlayerView(player: PlayerViewModel, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val hasAudio by player.hasAudio.collectAsState()
    val playing by player.playing.collectAsState()
    val elapsed by player.elapsed.collectAsState()
    val timing by player.timing.collectAsState()
    val title by player.currentDocTitle.collectAsState()

    if (!hasAudio) return

    val interactionSource = remember { MutableInteractionSource() }
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .background(Theme.bgRaised, RoundedCornerShape(Theme.Radius.card))
            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.card))
            .clickable(interactionSource = interactionSource, indication = null) { onOpen() }
            .padding(Theme.Space.sm),
    ) {
        androidx.compose.foundation.layout.Column(
            verticalArrangement = Arrangement.spacedBy(Theme.Space.xs),
        ) {
            ProgressBarView(value = timing.progress(elapsed) * 100, height = 2.dp)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    title ?: "",
                    color = Theme.fg1,
                    fontFamily = ListenFonts.inter,
                    fontWeight = FontWeight.Medium,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                val playInteraction = remember { MutableInteractionSource() }
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Theme.accent)
                        .clickable(interactionSource = playInteraction, indication = null) {
                            if (playing) player.pause() else player.play()
                        },
                ) {
                    AppIcon(if (playing) IconName.Pause else IconName.Play, size = 14.dp, color = androidx.compose.ui.graphics.Color.White)
                }
            }
        }
    }
}
