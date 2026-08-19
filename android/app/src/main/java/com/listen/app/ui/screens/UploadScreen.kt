package com.listen.app.ui.screens

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.ListenApplication
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.ui.components.PrimaryButton
import com.listen.app.ui.components.ProgressBarView
import com.listen.app.ui.components.ToastCenter
import com.listen.app.ui.components.ToastKind
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

private enum class UploadStage { IDLE, UPLOADING, DONE }

@Serializable
private data class UploadResult(val text: String, val wordCount: Int, val pageCount: Int)

private fun mimeTypeFor(name: String): String = when (name.substringAfterLast('.', "").lowercase()) {
    "pdf" -> "application/pdf"
    "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else -> "text/plain"
}

@Composable
fun UploadScreen(toast: ToastCenter, onDismiss: () -> Unit, onOpenInEditor: (String, String) -> Unit) {
    val context = LocalContext.current
    val api = (context.applicationContext as ListenApplication).apiClient
    val scope = rememberCoroutineScope()

    var stage by remember { mutableStateOf(UploadStage.IDLE) }
    var pct by remember { mutableStateOf(0.0) }
    var fileName by remember { mutableStateOf("") }
    var result by remember { mutableStateOf<UploadResult?>(null) }

    fun startUpload(uri: Uri) {
        val resolver = context.contentResolver
        var name = "document"
        resolver.query(uri, null, null, null, null)?.use { cursor ->
            val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (idx >= 0 && cursor.moveToFirst()) name = cursor.getString(idx)
        }
        fileName = name
        stage = UploadStage.UPLOADING
        pct = 0.0

        val bytes = try {
            resolver.openInputStream(uri)?.use { it.readBytes() }
        } catch (e: Exception) {
            null
        }
        if (bytes == null) {
            toast.show(ToastKind.ERROR, "Could not read that file.", scope)
            stage = UploadStage.IDLE
            return
        }
        if (bytes.size > 20 * 1024 * 1024) {
            toast.show(ToastKind.ERROR, "That file is over the 20 MB limit.", scope)
            stage = UploadStage.IDLE
            return
        }

        var progressJob: Job? = null
        scope.launch {
            progressJob = launch {
                while (isActive) {
                    delay(150)
                    pct = minOf(90.0, pct + 9)
                }
            }
            try {
                val uploaded = api.upload<UploadResult>("/api/upload", bytes, name, mimeTypeFor(name))
                pct = 100.0
                result = uploaded
                delay(200)
                stage = UploadStage.DONE
            } catch (e: Exception) {
                stage = UploadStage.IDLE
                toast.show(ToastKind.ERROR, e.message ?: "Could not read that file.", scope)
            } finally {
                progressJob?.cancel()
            }
        }
    }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) startUpload(uri)
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
            Text("Upload", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        }

        Column(modifier = Modifier.fillMaxWidth().padding(Theme.Space.base)) {
            when (stage) {
                UploadStage.IDLE -> {
                    val interaction = remember { MutableInteractionSource() }
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Theme.lineStrong, RoundedCornerShape(Theme.Radius.card))
                            .clickable(interactionSource = interaction, indication = null) {
                                picker.launch(arrayOf("text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                            }
                            .padding(vertical = 44.dp),
                    ) {
                        AppIcon(IconName.FileUp, size = 22.dp, color = Theme.accent)
                        Text("Choose a file", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        Text("TXT, PDF or DOCX · up to 20 MB", color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 13.sp)
                    }
                }

                UploadStage.UPLOADING -> {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
                            .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.card))
                            .padding(Theme.Space.base),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(fileName, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 14.sp, modifier = Modifier.weight(1f))
                            Text("${pct.toInt()}%", color = Theme.fg1, fontFamily = ListenFonts.mono, fontSize = 13.sp)
                        }
                        ProgressBarView(value = pct, height = 4.dp)
                        Text(if (pct < 90) "Uploading file" else "Extracting text", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 12.sp)
                    }
                }

                UploadStage.DONE -> {
                    val r = result
                    if (r != null) {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
                                .border(1.dp, Theme.success, RoundedCornerShape(Theme.Radius.card))
                                .padding(Theme.Space.lg),
                        ) {
                            AppIcon(IconName.Check, size = 20.dp, color = Theme.success)
                            val suffix = if (r.pageCount > 1) " from ${r.pageCount} pages. Review the text, then generate audio." else ". Review the text, then generate audio."
                            Text("Extracted ${r.wordCount} words$suffix", color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 14.sp)
                            PrimaryButton(label = "Open in editor", modifier = Modifier.padding(top = Theme.Space.md)) {
                                val title = fileName.substringBeforeLast('.')
                                onOpenInEditor(title, r.text)
                            }
                        }
                    }
                }
            }
        }
    }
}
