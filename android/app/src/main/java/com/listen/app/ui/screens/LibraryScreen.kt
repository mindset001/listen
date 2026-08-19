package com.listen.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import com.listen.app.ui.components.Chip
import com.listen.app.ui.components.PrimaryButton

private val filters = listOf("All", "Recent", "Favourites", "In progress", "Completed")

@Composable
fun LibraryScreen(library: LibraryViewModel, openReader: (Document) -> Unit) {
    var query by remember { mutableStateOf("") }
    var filter by remember { mutableStateOf("All") }
    var renamingDoc by remember { mutableStateOf<Document?>(null) }
    var renameText by remember { mutableStateOf("") }

    val documents by library.documents.collectAsState()
    val filtered = remember(documents, filter, query) {
        var list = documents
        list = when (filter) {
            "Favourites" -> list.filter { it.fav }
            "In progress" -> list.filter { it.pct in 1..99 }
            "Completed" -> list.filter { it.pct >= 100 }
            "Recent" -> list.filter { it.date == "Today" || it.date == "Yesterday" }
            else -> list
        }
        if (query.trim().isNotEmpty()) {
            val q = query.lowercase()
            list = list.filter { it.title.lowercase().contains(q) || it.displayText.lowercase().contains(q) }
        }
        list
    }

    Column(modifier = Modifier.fillMaxSize().background(Theme.bgBase)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Theme.Space.base)
                .padding(top = Theme.Space.base),
        ) {
            TextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Search documents", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 14.sp) },
                leadingIcon = { AppIcon(IconName.Search, size = 16.dp, color = Theme.fg3) },
                textStyle = androidx.compose.ui.text.TextStyle(color = Theme.fg1, fontFamily = ListenFonts.inter, fontSize = 14.sp),
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Theme.bgElevated, unfocusedContainerColor = Theme.bgElevated,
                    focusedIndicatorColor = Theme.lineQuiet, unfocusedIndicatorColor = Theme.lineQuiet,
                    cursorColor = Theme.accent,
                ),
                shape = RoundedCornerShape(Theme.Radius.input),
                modifier = Modifier.fillMaxWidth().height(56.dp),
            )
        }

        Spacer(Modifier.height(Theme.Space.md))
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = Theme.Space.base),
        ) {
            filters.forEach { f -> Chip(f, selected = filter == f) { filter = f } }
        }
        Spacer(Modifier.height(Theme.Space.md))

        if (filtered.isEmpty()) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxWidth().padding(top = 64.dp),
            ) {
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier.size(width = 38.dp, height = 6.dp).background(Theme.lineStrong, RoundedCornerShape(3.dp)),
                )
                Text(
                    "Nothing here yet. Your first document goes here.",
                    color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 14.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
                PrimaryButton(label = "Clear filters", modifier = Modifier.size(width = 160.dp, height = 44.dp)) {
                    filter = "All"; query = ""
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(Theme.Space.md),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(Theme.Space.base),
                modifier = Modifier.fillMaxSize().padding(bottom = 100.dp),
            ) {
                items(filtered, key = { it.id }) { doc ->
                    LibraryCard(
                        doc = doc,
                        onListen = { openReader(doc) },
                        onFavourite = { library.toggleFavourite(doc.id) },
                        onRename = { renamingDoc = doc; renameText = doc.title },
                        onDelete = { library.delete(doc.id) },
                    )
                }
            }
        }
    }

    val doc = renamingDoc
    if (doc != null) {
        AlertDialog(
            onDismissRequest = { renamingDoc = null },
            title = { Text("Rename document") },
            text = {
                TextField(value = renameText, onValueChange = { renameText = it }, singleLine = true)
            },
            confirmButton = {
                Text(
                    "Save",
                    color = Theme.accent,
                    modifier = Modifier.clickable {
                        library.rename(doc.id, renameText)
                        renamingDoc = null
                    }.padding(8.dp),
                )
            },
            dismissButton = {
                Text("Cancel", color = Theme.fg2, modifier = Modifier.clickable { renamingDoc = null }.padding(8.dp))
            },
        )
    }
}

@Composable
private fun LibraryCard(doc: Document, onListen: () -> Unit, onFavourite: () -> Unit, onRename: () -> Unit, onDelete: () -> Unit) {
    val buttonLabel = if (doc.pct >= 100) "Listen again" else if (doc.pct > 0) "Continue from ${doc.pct}%" else "Listen"
    val (statusLabel, statusColor) = when {
        doc.pct >= 100 -> "Completed" to Theme.success
        doc.pct > 0 -> "In progress ${doc.pct}%" to Theme.fg2
        else -> "Not started" to Theme.fg3
    }

    Column(
        verticalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .fillMaxWidth()
            .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.card))
            .padding(Theme.Space.base),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("DOCUMENT", color = Theme.fg3, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 11.sp, letterSpacing = 0.96.sp)
            Spacer(Modifier.weight(1f))
            if (doc.audio) AppIcon(IconName.AudioLines, size = 16.dp, color = Theme.accent)
            Spacer(Modifier.width(8.dp))
            val favInteraction = remember { MutableInteractionSource() }
            AppIcon(
                IconName.Heart, size = 16.dp,
                color = if (doc.fav) Theme.accent else Theme.fg3, filled = doc.fav,
                modifier = Modifier.clickable(interactionSource = favInteraction, indication = null) { onFavourite() },
            )
        }
        Text(doc.title, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(doc.displayText, color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 13.sp, maxLines = 3, overflow = TextOverflow.Ellipsis)
        Text(statusLabel, color = statusColor, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 13.sp)
        Text("${doc.duration} · ${doc.date}", color = Theme.fg3, fontFamily = ListenFonts.mono, fontSize = 12.sp)

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
            PrimaryButton(label = buttonLabel, modifier = Modifier.weight(1f).height(44.dp), onClick = onListen)
            IconSquareButton(IconName.Pencil, onRename)
            IconSquareButton(IconName.Trash, onDelete)
        }
    }
}

@Composable
private fun IconSquareButton(icon: IconName, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    androidx.compose.foundation.layout.Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(44.dp)
            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.input))
            .clickable(interactionSource = interaction, indication = null) { onClick() },
    ) {
        AppIcon(icon, size = 16.dp, color = Theme.fg2)
    }
}
