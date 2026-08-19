package com.listen.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.data.LibraryViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.models.Document
import com.listen.app.ui.components.ToastCenter
import com.listen.app.ui.components.ToastKind

@Composable
fun SavedAudioScreen(library: LibraryViewModel, toast: ToastCenter, openReader: (Document) -> Unit) {
    val documents by library.documents.collectAsState()
    val voices by library.voices.collectAsState()
    val savedAudio = documents.filter { it.audio }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Theme.bgBase)
            .verticalScroll(rememberScrollState())
            .padding(Theme.Space.base)
            .padding(bottom = 140.dp),
    ) {
        Text("Saved audio", color = Theme.fg1, fontFamily = ListenFonts.interTight, fontWeight = FontWeight.SemiBold, fontSize = 22.sp)
        Spacer(Modifier.height(Theme.Space.base))
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            savedAudio.forEach { doc ->
                val voiceName = voices.firstOrNull { it.id == doc.voice }?.name ?: (doc.voice ?: "")
                val interaction = remember { MutableInteractionSource() }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
                        .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.card))
                        .padding(12.dp),
                ) {
                    val playInteraction = remember { MutableInteractionSource() }
                    androidx.compose.foundation.layout.Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(40.dp)
                            .border(1.dp, Theme.lineStrong, CircleShape)
                            .clickable(interactionSource = playInteraction, indication = null) { openReader(doc) },
                    ) {
                        AppIcon(IconName.Play, size = 16.dp, color = Theme.fg1)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(doc.title, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text("${doc.duration} · $voiceName · ${doc.date}", color = Theme.fg3, fontFamily = ListenFonts.mono, fontSize = 12.sp)
                    }
                    AppIcon(
                        IconName.Download, size = 18.dp, color = Theme.fg2,
                        modifier = Modifier.clickable(interactionSource = interaction, indication = null) {
                            toast.show(ToastKind.SUCCESS, "Download started", scope)
                        },
                    )
                }
            }
        }
    }
}
