package com.listen.app.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.data.LibraryViewModel
import com.listen.app.data.PlayerViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.services.Timing

private enum class SentenceState { READ, ACTIVE, UPCOMING }

@Composable
fun ReaderScreen(player: PlayerViewModel, library: LibraryViewModel, onBack: () -> Unit) {
    val playing by player.playing.collectAsState()
    val elapsed by player.elapsed.collectAsState()
    val timing by player.timing.collectAsState()
    val fontSize by player.fontSize.collectAsState()
    val lineHeight by player.lineHeight.collectAsState()
    val measure by player.measure.collectAsState()
    val focus by player.focus.collectAsState()
    val voice by player.voice.collectAsState()
    val speed by player.speed.collectAsState()
    val voices by library.voices.collectAsState()

    val activeIndex = timing.indexAt(elapsed)
    val voiceName = voices.firstOrNull { it.id == voice }?.name ?: voice
    val listState = rememberLazyListState()

    LaunchedEffect(activeIndex, playing) {
        if (playing) listState.animateScrollToItem(maxOf(0, activeIndex))
    }

    Column(modifier = Modifier.fillMaxSize().background(Theme.bgBase)) {
        if (!focus) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth().height(48.dp).padding(horizontal = Theme.Space.base),
            ) {
                val backInteraction = remember { MutableInteractionSource() }
                AppIcon(
                    IconName.ChevronLeft, size = 22.dp, color = Theme.fg1,
                    modifier = Modifier.clickable(interactionSource = backInteraction, indication = null) { onBack() },
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "$voiceName · Segment ${player.segment} of ${player.totalSegments}",
                    color = Theme.fg3, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 12.sp, letterSpacing = 0.96.sp,
                )
                Spacer(Modifier.weight(1f))
                val focusInteraction = remember { MutableInteractionSource() }
                AppIcon(
                    IconName.Focus, size = 18.dp, color = Theme.fg2,
                    modifier = Modifier.clickable(interactionSource = focusInteraction, indication = null) { player.toggleFocus() },
                )
            }
        } else {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = Theme.Space.base, vertical = Theme.Space.sm), horizontalArrangement = Arrangement.End) {
                val closeInteraction = remember { MutableInteractionSource() }
                AppIcon(
                    IconName.X, size = 18.dp, color = Theme.fg2,
                    modifier = Modifier.clickable(interactionSource = closeInteraction, indication = null) { player.toggleFocus() }.padding(8.dp),
                )
            }
        }

        LazyColumn(
            state = listState,
            verticalArrangement = Arrangement.spacedBy(6.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(Theme.Space.base),
            modifier = Modifier.weight(1f).fillMaxWidth(fraction = measure.toFloat()),
        ) {
            itemsIndexed(timing.sentences) { i, sentence ->
                val state = if (i < activeIndex) SentenceState.READ else if (i == activeIndex) SentenceState.ACTIVE else SentenceState.UPCOMING
                SentenceRow(sentence, state, fontSize, lineHeight) { player.seekToSentence(i) }
            }
        }

        if (!focus) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Theme.bgBase)
                    .padding(horizontal = Theme.Space.base, vertical = Theme.Space.sm),
            ) {
                pill(IconName.Focus, "Focus") { player.toggleFocus() }
                pill(IconName.Type, "A−") { player.decFontSize() }
                pill(IconName.Type, "A+") { player.incFontSize() }
                pill(IconName.UnfoldVertical, "Spacing") { player.cycleLineHeight() }
                pill(IconName.UnfoldHorizontal, "Width") { player.cycleMeasure() }
            }
        }

        PlayerBar(player, playing, elapsed, timing, speed)
    }
}

@Composable
private fun SentenceRow(text: String, state: SentenceState, fontSize: Int, lineHeight: Double, onTap: () -> Unit) {
    val textColor = when (state) {
        SentenceState.READ -> Theme.fg3
        SentenceState.ACTIVE -> Theme.fg1
        SentenceState.UPCOMING -> Theme.fg2
    }
    val background = if (state == SentenceState.ACTIVE) Theme.accentWash else Color.Transparent
    val barColor = if (state == SentenceState.ACTIVE) Theme.accent else Color.Transparent

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(background, RoundedCornerShape(8.dp))
            .clickable { onTap() },
    ) {
        Box(modifier = Modifier.width(2.dp).background(barColor))
        Text(
            text,
            color = textColor,
            fontFamily = ListenFonts.inter,
            fontSize = fontSize.sp,
            lineHeight = (fontSize * lineHeight).sp,
            modifier = Modifier.padding(vertical = 6.dp, horizontal = 12.dp),
        )
    }
}

@Composable
private fun pill(icon: IconName, label: String, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.pill))
            .clickable(interactionSource = interaction, indication = null) { onClick() }
            .padding(horizontal = 10.dp, vertical = 6.dp),
    ) {
        AppIcon(icon, size = 14.dp, color = Theme.fg2)
        Text(label, color = Theme.fg2, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 11.sp)
    }
}

@Composable
private fun PlayerBar(player: PlayerViewModel, playing: Boolean, elapsed: Double, timing: com.listen.app.services.SentenceTiming, speed: Double) {
    val progress = timing.progress(elapsed).toFloat()
    val formattedSpeed = if (speed % 1.0 == 0.0) speed.toInt().toString() else speed.toString()

    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth().padding(Theme.Space.base),
    ) {
        var trackWidth by remember { mutableIntStateOf(0) }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .onGloballyPositioned { trackWidth = it.size.width }
                .pointerInput(timing.total) {
                    detectDragGestures { change, _ ->
                        val pct = (change.position.x / trackWidth.coerceAtLeast(1)).coerceIn(0f, 1f)
                        player.seek(timing.total * pct)
                    }
                },
        ) {
            Box(modifier = Modifier.fillMaxSize().background(Theme.lineQuiet, RoundedCornerShape(Theme.Radius.pill)))
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(fraction = progress.coerceIn(0f, 1f))
                    .background(Theme.accent, RoundedCornerShape(Theme.Radius.pill)),
            )
        }

        Row(modifier = Modifier.fillMaxWidth()) {
            Text(Timing.formatTime(elapsed), color = Theme.fg3, fontFamily = ListenFonts.mono, fontSize = 12.sp)
            Spacer(Modifier.weight(1f))
            Text(Timing.formatTime(timing.total), color = Theme.fg3, fontFamily = ListenFonts.mono, fontSize = 12.sp)
        }

        Box(modifier = Modifier.fillMaxWidth()) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(Theme.Space.lg),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.align(Alignment.Center),
            ) {
                val prevInteraction = remember { MutableInteractionSource() }
                AppIcon(IconName.SkipBack, size = 22.dp, color = Theme.fg1, modifier = Modifier.clickable(interactionSource = prevInteraction, indication = null) { player.prev() })

                val playInteraction = remember { MutableInteractionSource() }
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(52.dp)
                        .background(Theme.accent, CircleShape)
                        .clickable(interactionSource = playInteraction, indication = null) { if (playing) player.pause() else player.play() },
                ) {
                    AppIcon(if (playing) IconName.Pause else IconName.Play, size = 22.dp, color = Color.White)
                }

                val nextInteraction = remember { MutableInteractionSource() }
                AppIcon(IconName.SkipForward, size = 22.dp, color = Theme.fg1, modifier = Modifier.clickable(interactionSource = nextInteraction, indication = null) { player.next() })

                val stopInteraction = remember { MutableInteractionSource() }
                AppIcon(IconName.Stop, size = 20.dp, color = Theme.fg2, modifier = Modifier.clickable(interactionSource = stopInteraction, indication = null) { player.stop() })
            }

            val speedInteraction = remember { MutableInteractionSource() }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .background(Color.Transparent, RoundedCornerShape(Theme.Radius.pill))
                    .clickable(interactionSource = speedInteraction, indication = null) { player.cycleSpeed() }
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            ) {
                Text("${formattedSpeed}x", color = Theme.fg2, fontFamily = ListenFonts.mono, fontWeight = FontWeight.Medium, fontSize = 12.sp)
            }
        }
    }
}
