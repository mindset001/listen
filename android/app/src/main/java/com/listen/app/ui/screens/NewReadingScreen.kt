package com.listen.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.data.LibraryViewModel
import com.listen.app.data.PlayerViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.services.MockData
import com.listen.app.services.Timing
import com.listen.app.ui.components.Chip
import com.listen.app.ui.components.PrimaryButton
import com.listen.app.ui.components.ProgressBarView
import com.listen.app.ui.components.ToastCenter
import com.listen.app.ui.components.ToastKind
import kotlinx.coroutines.launch

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun NewReadingScreen(
    player: PlayerViewModel,
    library: LibraryViewModel,
    toast: ToastCenter,
    prefillTitle: String?,
    prefillText: String?,
    onDismiss: () -> Unit,
    onGenerated: () -> Unit,
) {
    val voices by library.voices.collectAsState()
    val generating by player.generating.collectAsState()
    val genPct by player.genPct.collectAsState()
    val clipboard = LocalClipboardManager.current
    val scope = rememberCoroutineScope()

    var title by remember { mutableStateOf(prefillTitle ?: "") }
    var text by remember { mutableStateOf(prefillText ?: "") }
    var voice by remember(voices) { mutableStateOf(voices.firstOrNull()?.id ?: "") }
    var speedIndex by remember { mutableStateOf(Timing.speeds.indexOf(1.0).let { if (it < 0) 2 else it }) }
    var tone by remember { mutableStateOf(MockData.tones[0]) }

    val chars = text.length
    val words = Timing.wordCount(text)
    val segments = maxOf(2, Math.ceil(chars / 900.0).toInt())
    val speed = Timing.speeds[speedIndex]
    val formattedSpeed = if (speed % 1.0 == 0.0) speed.toInt().toString() else speed.toString()

    fun generate() {
        scope.launch {
            try {
                player.generate(title = title, content = text, voice = voice, speed = speed, tone = tone)
                toast.show(ToastKind.SUCCESS, "Audio ready", scope)
                onGenerated()
            } catch (e: Exception) {
                if (e.message != null) toast.show(ToastKind.ERROR, e.message!!, scope)
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Theme.bgBase)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth().padding(Theme.Space.base),
        ) {
            val backInteraction = remember { MutableInteractionSource() }
            AppIcon(
                IconName.ChevronLeft, size = 20.dp, color = Theme.fg1,
                modifier = Modifier.clickable(interactionSource = backInteraction, indication = null) { onDismiss() },
            )
            Spacer(Modifier.width(Theme.Space.md))
            Text("New reading", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = Theme.Space.base),
        ) {
            TextField(
                value = title,
                onValueChange = { title = it },
                placeholder = { Text("Enter document title", color = Theme.fg3, fontFamily = ListenFonts.interTight, fontSize = 16.sp) },
                textStyle = androidx.compose.ui.text.TextStyle(color = Theme.fg1, fontFamily = ListenFonts.interTight, fontSize = 16.sp),
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Theme.bgElevated, unfocusedContainerColor = Theme.bgElevated,
                    focusedIndicatorColor = Theme.lineQuiet, unfocusedIndicatorColor = Theme.lineQuiet,
                    cursorColor = Theme.accent,
                ),
                shape = RoundedCornerShape(Theme.Radius.input),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(Theme.Space.md))

            TextField(
                value = text,
                onValueChange = { text = it },
                placeholder = { Text("Paste or type the text you want read aloud.", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 15.sp) },
                textStyle = androidx.compose.ui.text.TextStyle(color = Theme.fg1, fontFamily = ListenFonts.inter, fontSize = 15.sp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Theme.bgElevated, unfocusedContainerColor = Theme.bgElevated,
                    focusedIndicatorColor = Theme.lineQuiet, unfocusedIndicatorColor = Theme.lineQuiet,
                    cursorColor = Theme.accent,
                ),
                shape = RoundedCornerShape(Theme.Radius.input),
                modifier = Modifier.fillMaxWidth().heightIn(min = 180.dp),
            )
            Spacer(Modifier.height(Theme.Space.sm))

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Text("$chars characters · $words words", color = Theme.fg3, fontFamily = ListenFonts.mono, fontSize = 12.sp)
                Spacer(Modifier.weight(1f))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    iconButton(IconName.Copy) { clipboard.setText(AnnotatedString(text)); toast.show(ToastKind.SUCCESS, "Copied", scope) }
                    iconButton(IconName.Save) { toast.show(ToastKind.SUCCESS, "Saved", scope) }
                    iconButton(IconName.Trash) { text = "" }
                }
            }

            Spacer(Modifier.height(Theme.Space.lg))
            sectionLabel("Voice")
            Spacer(Modifier.height(Theme.Space.sm))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                voices.forEach { v ->
                    val selected = voice == v.id
                    val interaction = remember { MutableInteractionSource() }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(if (selected) Theme.accentWash else androidx.compose.ui.graphics.Color.Transparent, RoundedCornerShape(Theme.Radius.input))
                            .border(1.dp, if (selected) Theme.accent else androidx.compose.ui.graphics.Color.Transparent, RoundedCornerShape(Theme.Radius.input))
                            .clickable(interactionSource = interaction, indication = null) { voice = v.id }
                            .padding(10.dp),
                    ) {
                        androidx.compose.foundation.layout.Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.size(28.dp).background(Theme.bgRaised, CircleShape),
                        ) {
                            Text(v.name.firstOrNull()?.toString() ?: "?", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(v.name, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                            Text(v.note, color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 12.sp)
                        }
                        if (selected) AppIcon(IconName.Check, size = 18.dp, color = Theme.accent)
                    }
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(top = Theme.Space.md)) {
                sectionLabel("Speed")
                Spacer(Modifier.weight(1f))
                Text("${formattedSpeed}x", color = Theme.fg1, fontFamily = ListenFonts.mono, fontSize = 13.sp)
            }
            Spacer(Modifier.height(Theme.Space.sm))
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().height(28.dp)) {
                Timing.speeds.indices.forEach { i ->
                    val dotInteraction = remember { MutableInteractionSource() }
                    androidx.compose.foundation.layout.Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.weight(1f).clickable(interactionSource = dotInteraction, indication = null) { speedIndex = i },
                    ) {
                        androidx.compose.foundation.layout.Box(
                            modifier = Modifier
                                .size(10.dp)
                                .background(if (i <= speedIndex) Theme.accent else Theme.lineStrong, CircleShape),
                        )
                    }
                }
            }
            Row(modifier = Modifier.fillMaxWidth()) {
                Text("0.5x", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 11.sp)
                Spacer(Modifier.weight(1f))
                Text("1x", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 11.sp)
                Spacer(Modifier.weight(1f))
                Text("2x", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 11.sp)
            }

            Spacer(Modifier.height(Theme.Space.lg))
            sectionLabel("Tone")
            Spacer(Modifier.height(Theme.Space.sm))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                MockData.tones.forEach { t -> Chip(t, selected = t == tone) { tone = t } }
            }
            Spacer(Modifier.height(6.dp))
            Text("Tone options come from the selected voice model.", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 12.sp)

            if (chars > 900) {
                Spacer(Modifier.height(Theme.Space.base))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
                        .border(1.dp, Theme.lineStrong, RoundedCornerShape(Theme.Radius.card))
                        .padding(Theme.Space.base),
                ) {
                    AppIcon(IconName.Layers, size = 18.dp, color = Theme.fg2)
                    Text(
                        "This text is longer than one request allows. It will be split into $segments segments at paragraph breaks and played back as one continuous session.",
                        color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 13.sp,
                    )
                }
            }
            Spacer(Modifier.height(Theme.Space.base))
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(Theme.Space.sm),
            modifier = Modifier
                .fillMaxWidth()
                .background(Theme.bgBase)
                .border(0.dp, androidx.compose.ui.graphics.Color.Transparent)
                .padding(Theme.Space.base),
        ) {
            PrimaryButton(
                label = if (generating) "Generating your audio" else "Generate audio",
                disabled = generating, loading = generating,
                onClick = { generate() },
            )
            if (generating) ProgressBarView(value = genPct, height = 4.dp)
        }
    }
}

@Composable
private fun sectionLabel(text: String) {
    Text(text.uppercase(), color = Theme.fg3, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 12.sp, letterSpacing = 0.96.sp)
}

@Composable
private fun iconButton(icon: IconName, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    androidx.compose.foundation.layout.Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(32.dp)
            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(6.dp))
            .clickable(interactionSource = interaction, indication = null) { onClick() },
    ) {
        AppIcon(icon, size = 15.dp, color = Theme.fg2)
    }
}
