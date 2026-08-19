package com.listen.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.data.AuthViewModel
import com.listen.app.data.LibraryViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.models.Document
import com.listen.app.ui.components.ProgressBarView
import androidx.compose.runtime.collectAsState

@Composable
fun DashboardScreen(
    auth: AuthViewModel,
    library: LibraryViewModel,
    openNewReading: () -> Unit,
    openUpload: () -> Unit,
    openReader: (Document) -> Unit,
) {
    val user by auth.user.collectAsState()
    val documents by library.documents.collectAsState()
    val continueDoc = documents.firstOrNull { it.pct in 1..99 } ?: documents.firstOrNull()
    val recent = documents.take(3)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Theme.bgBase)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Theme.Space.base)
            .padding(top = Theme.Space.lg, bottom = 140.dp),
    ) {
        Text("Welcome back, ${user?.name ?: ""}", color = Theme.fg1, fontFamily = ListenFonts.interTight, fontWeight = FontWeight.SemiBold, fontSize = 26.sp)
        Spacer(Modifier.height(4.dp))
        Text("Pick up where you left off, or start something new.", color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 15.sp)
        Spacer(Modifier.height(Theme.Space.lg))

        // Quick actions
        Column(verticalArrangement = Arrangement.spacedBy(Theme.Space.md)) {
            if (continueDoc != null) {
                val interaction = remember { MutableInteractionSource() }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Theme.accent, RoundedCornerShape(Theme.Radius.card))
                        .clickable(interactionSource = interaction, indication = null) { openReader(continueDoc) }
                        .padding(Theme.Space.base),
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(44.dp).background(Color.White.copy(alpha = 0.16f), CircleShape),
                    ) {
                        AppIcon(IconName.Play, size = 18.dp, color = Color.White)
                    }
                    Spacer(Modifier.width(Theme.Space.md))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Continue reading", color = Color.White, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        Text(
                            "${continueDoc.title} · ${continueDoc.pct}% through",
                            color = Color.White.copy(alpha = 0.75f),
                            fontFamily = ListenFonts.inter, fontSize = 13.sp,
                            maxLines = 1, overflow = TextOverflow.Ellipsis,
                        )
                    }
                    AppIcon(IconName.ChevronRight, size = 18.dp, color = Color.White.copy(alpha = 0.75f))
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(Theme.Space.md)) {
                QuickCard("New reading", IconName.PenLine, Modifier.weight(1f), openNewReading)
                QuickCard("Upload document", IconName.FileUp, Modifier.weight(1f), openUpload)
            }
        }

        Spacer(Modifier.height(Theme.Space.xl))
        Text("Recent reads", color = Theme.fg1, fontFamily = ListenFonts.interTight, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
        Spacer(Modifier.height(Theme.Space.md))
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            recent.forEach { doc -> RecentReadCard(doc) { openReader(doc) } }
        }
    }
}

@Composable
private fun QuickCard(label: String, icon: IconName, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    Column(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = modifier
            .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.card))
            .clickable(interactionSource = interaction, indication = null) { onClick() }
            .padding(Theme.Space.base),
    ) {
        AppIcon(icon, size = 20.dp, color = Theme.fg2)
        Text(label, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 14.sp)
    }
}

@Composable
private fun RecentReadCard(doc: Document, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.card))
            .clickable(interactionSource = interaction, indication = null) { onClick() }
            .padding(Theme.Space.base),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                doc.title, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 15.sp,
                maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f),
            )
            if (doc.fav) AppIcon(IconName.Heart, size = 14.dp, color = Theme.accent, filled = true)
        }
        Text(doc.displayText, color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
        ProgressBarView(value = doc.pct.toDouble())
        Text("${doc.pct}% · ${doc.duration} · ${doc.date}", color = Theme.fg3, fontFamily = ListenFonts.mono, fontSize = 12.sp)
    }
}
