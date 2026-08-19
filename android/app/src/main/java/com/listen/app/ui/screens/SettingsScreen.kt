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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.data.AuthViewModel
import com.listen.app.data.PlaybackSwitches
import com.listen.app.data.PlayerViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.ui.components.PrimaryButton
import com.listen.app.ui.components.ToastCenter
import com.listen.app.ui.components.ToastKind
import kotlinx.coroutines.launch

private data class SwitchRow(val label: String, val note: String, val get: (PlaybackSwitches) -> Boolean, val set: (PlaybackSwitches, Boolean) -> PlaybackSwitches)

private val switchRows = listOf(
    SwitchRow("Continue to next segment", "Play the next segment automatically when one finishes.", { it.autoContinue }, { s, v -> s.copy(autoContinue = v) }),
    SwitchRow("Scroll to the active sentence", "Keep the reader following along while audio plays.", { it.followText }, { s, v -> s.copy(followText = v) }),
    SwitchRow("Remember where you stopped", "Reopen a document at the last sentence you heard.", { it.resume }, { s, v -> s.copy(resume = v) }),
    SwitchRow("Download over Wi-Fi only", "Avoid using mobile data for saved audio.", { it.wifiOnly }, { s, v -> s.copy(wifiOnly = v) }),
)

private val emailRegex = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+\$")

@Composable
fun SettingsScreen(player: PlayerViewModel, auth: AuthViewModel, toast: ToastCenter) {
    val user by auth.user.collectAsState()
    val fontSize by player.fontSize.collectAsState()
    val lineHeight by player.lineHeight.collectAsState()
    val measure by player.measure.collectAsState()
    val switches by player.switches.collectAsState()
    val scope = rememberCoroutineScope()

    var profileName by remember(user) { mutableStateOf(user?.name ?: "") }
    var profileEmail by remember(user) { mutableStateOf(user?.email ?: "") }
    var profileCurrentPassword by remember { mutableStateOf("") }
    var profileError by remember { mutableStateOf<String?>(null) }
    var profileSubmitting by remember { mutableStateOf(false) }

    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var passwordSubmitting by remember { mutableStateOf(false) }

    var deleteOpen by remember { mutableStateOf(false) }
    var deletePassword by remember { mutableStateOf("") }
    var deleteSubmitting by remember { mutableStateOf(false) }

    val emailChanged = profileEmail.trim().lowercase() != user?.email
    val profileDirty = profileName.trim() != user?.name || emailChanged

    fun submitProfile() {
        profileError = null
        val name = profileName.trim()
        val email = profileEmail.trim()
        if (name.isEmpty()) { profileError = "Name can't be empty."; return }
        if (emailChanged && !emailRegex.matches(email)) { profileError = "That does not look like an email address."; return }
        if (emailChanged && user?.hasPassword == true && profileCurrentPassword.isEmpty()) {
            profileError = "Enter your current password to change your email."
            return
        }
        profileSubmitting = true
        scope.launch {
            try {
                auth.updateProfile(name, email, profileCurrentPassword.ifEmpty { null })
                profileCurrentPassword = ""
                toast.show(ToastKind.SUCCESS, "Profile updated", scope)
            } catch (e: Exception) {
                profileError = e.message ?: "Something went wrong."
            } finally {
                profileSubmitting = false
            }
        }
    }

    fun submitPassword() {
        passwordError = null
        if (user?.hasPassword == true && currentPassword.isEmpty()) { passwordError = "Enter your current password."; return }
        if (newPassword.length < 8) { passwordError = "Passwords need at least 8 characters."; return }
        if (newPassword != confirmPassword) { passwordError = "Passwords do not match."; return }
        passwordSubmitting = true
        scope.launch {
            try {
                auth.changePassword(currentPassword.ifEmpty { null }, newPassword)
                currentPassword = ""; newPassword = ""; confirmPassword = ""
                toast.show(ToastKind.SUCCESS, if (user?.hasPassword == true) "Password updated" else "Password set", scope)
            } catch (e: Exception) {
                passwordError = e.message ?: "Something went wrong."
            } finally {
                passwordSubmitting = false
            }
        }
    }

    fun confirmDelete() {
        if (user?.hasPassword == true && deletePassword.isEmpty()) {
            toast.show(ToastKind.ERROR, "Enter your password to confirm.", scope)
            return
        }
        deleteSubmitting = true
        scope.launch {
            try {
                auth.deleteAccount(deletePassword.ifEmpty { null })
                toast.show(ToastKind.INFO, "Account deleted", scope)
            } catch (e: Exception) {
                toast.show(ToastKind.ERROR, e.message ?: "Something went wrong.", scope)
            } finally {
                deleteSubmitting = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Theme.bgBase)
            .verticalScroll(rememberScrollState())
            .padding(Theme.Space.base)
            .padding(bottom = 140.dp),
    ) {
        Text("Settings", color = Theme.fg1, fontFamily = ListenFonts.interTight, fontWeight = FontWeight.SemiBold, fontSize = 22.sp)
        Spacer(Modifier.height(Theme.Space.xl))

        group("Reading") {
            sliderRow("Text size", "${fontSize}px", player::decFontSize, player::incFontSize)
            divider()
            sliderRow("Line spacing", "%.2f".format(lineHeight), player::cycleLineHeight, player::cycleLineHeight)
            divider()
            sliderRow("Reading width", "${(measure * 100).toInt()}%", player::cycleMeasure, player::cycleMeasure)
        }

        Spacer(Modifier.height(Theme.Space.xl))
        group("Playback") {
            switchRows.forEachIndexed { idx, row ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().padding(Theme.Space.base),
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(row.label, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                        Text(row.note, color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 12.sp)
                    }
                    Switch(
                        checked = row.get(switches),
                        onCheckedChange = { v -> player.toggleSwitch { row.set(it, v) } },
                        colors = SwitchDefaults.colors(checkedTrackColor = Theme.accent),
                    )
                }
                if (idx < switchRows.size - 1) divider()
            }
        }

        Spacer(Modifier.height(Theme.Space.xl))
        group("Account") {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(Theme.Space.base)) {
                androidx.compose.foundation.layout.Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.size(40.dp).background(Theme.bgRaised, CircleShape),
                ) {
                    Text(user?.name?.firstOrNull()?.toString() ?: "?", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(user?.name ?: "", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                    Text(user?.email ?: "", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 12.sp)
                }
            }
            divider()
            val logoutInteraction = remember { MutableInteractionSource() }
            Text(
                "Log out", color = Theme.danger, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 14.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(interactionSource = logoutInteraction, indication = null) { scope.launch { auth.logout() } }
                    .padding(Theme.Space.base),
            )
        }

        Spacer(Modifier.height(Theme.Space.xl))
        sectionLabel("Profile")
        Spacer(Modifier.height(Theme.Space.sm))
        Column(
            verticalArrangement = Arrangement.spacedBy(Theme.Space.md),
            modifier = Modifier.fillMaxWidth().background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card)).padding(Theme.Space.base),
        ) {
            settingsField("Name", profileName, { profileName = it })
            settingsField("Email", profileEmail, { profileEmail = it }, keyboardType = KeyboardType.Email)
            if (emailChanged && user?.hasPassword == true) {
                settingsField("Current password", profileCurrentPassword, { profileCurrentPassword = it }, isSecure = true, placeholder = "Required to change your email")
            }
            profileError?.let { Text(it, color = Theme.caution, fontFamily = ListenFonts.inter, fontSize = 13.sp) }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                PrimaryButton(
                    label = if (profileSubmitting) "Saving…" else "Save changes",
                    disabled = !profileDirty || profileSubmitting, loading = profileSubmitting,
                    modifier = Modifier.width(160.dp),
                    onClick = { submitProfile() },
                )
            }
        }

        Spacer(Modifier.height(Theme.Space.xl))
        sectionLabel("Password")
        Spacer(Modifier.height(Theme.Space.sm))
        Column(
            verticalArrangement = Arrangement.spacedBy(Theme.Space.md),
            modifier = Modifier.fillMaxWidth().background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card)).padding(Theme.Space.base),
        ) {
            if (user?.hasPassword != true) {
                Text("You signed in with Google and don't have a password yet. Set one to also be able to sign in with your email.", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 13.sp)
            }
            if (user?.hasPassword == true) {
                settingsField("Current password", currentPassword, { currentPassword = it }, isSecure = true, reveal = passwordVisible, onToggleReveal = { passwordVisible = !passwordVisible })
            }
            settingsField("New password", newPassword, { newPassword = it }, isSecure = true, placeholder = "At least 8 characters", reveal = passwordVisible, onToggleReveal = { passwordVisible = !passwordVisible })
            settingsField("Confirm new password", confirmPassword, { confirmPassword = it }, isSecure = !passwordVisible)
            passwordError?.let { Text(it, color = Theme.caution, fontFamily = ListenFonts.inter, fontSize = 13.sp) }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                PrimaryButton(
                    label = if (passwordSubmitting) "Saving…" else (if (user?.hasPassword == true) "Update password" else "Set password"),
                    disabled = passwordSubmitting, loading = passwordSubmitting,
                    modifier = Modifier.width(180.dp),
                    onClick = { submitPassword() },
                )
            }
        }

        Spacer(Modifier.height(Theme.Space.xl))
        sectionLabel("Danger zone")
        Spacer(Modifier.height(Theme.Space.sm))
        Column(
            verticalArrangement = Arrangement.spacedBy(Theme.Space.md),
            modifier = Modifier
                .fillMaxWidth()
                .background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))
                .border(1.dp, if (deleteOpen) Theme.danger else Theme.lineQuiet, RoundedCornerShape(Theme.Radius.card))
                .padding(Theme.Space.base),
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Delete account", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 15.sp)
                    Text("Permanently deletes your account, documents and generated audio. This can't be undone.", color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 13.sp)
                }
                if (!deleteOpen) {
                    val interaction = remember { MutableInteractionSource() }
                    Text(
                        "Delete account", color = Theme.fg1, fontFamily = ListenFonts.inter, fontSize = 13.sp,
                        modifier = Modifier
                            .border(1.dp, Theme.lineStrong, RoundedCornerShape(Theme.Radius.button))
                            .clickable(interactionSource = interaction, indication = null) { deleteOpen = true }
                            .padding(horizontal = 14.dp, vertical = 9.dp),
                    )
                }
            }
            if (deleteOpen) {
                divider()
                if (user?.hasPassword == true) {
                    settingsField("Enter your password to confirm", deletePassword, { deletePassword = it }, isSecure = true)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    Spacer(Modifier.weight(1f))
                    val cancelInteraction = remember { MutableInteractionSource() }
                    Text(
                        "Cancel", color = Theme.fg1, fontFamily = ListenFonts.inter, fontSize = 13.sp,
                        modifier = Modifier
                            .border(1.dp, Theme.lineStrong, RoundedCornerShape(Theme.Radius.button))
                            .clickable(interactionSource = cancelInteraction, indication = null) { deleteOpen = false; deletePassword = "" }
                            .padding(horizontal = 14.dp, vertical = 9.dp),
                    )
                    val deleteInteraction = remember { MutableInteractionSource() }
                    Text(
                        if (deleteSubmitting) "Deleting…" else "Permanently delete my account",
                        color = androidx.compose.ui.graphics.Color.White, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 13.sp,
                        modifier = Modifier
                            .background(Theme.danger, RoundedCornerShape(Theme.Radius.button))
                            .clickable(interactionSource = deleteInteraction, indication = null, enabled = !deleteSubmitting) { confirmDelete() }
                            .padding(horizontal = 14.dp, vertical = 9.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun divider() {
    androidx.compose.foundation.layout.Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Theme.lineQuiet))
}

@Composable
private fun group(title: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        sectionLabel(title)
        Column(modifier = Modifier.background(Theme.bgElevated, RoundedCornerShape(Theme.Radius.card))) {
            content()
        }
    }
}

@Composable
private fun sectionLabel(title: String) {
    Text(title.uppercase(), color = Theme.fg3, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 12.sp, letterSpacing = 0.96.sp)
}

@Composable
private fun sliderRow(label: String, value: String, onDec: () -> Unit, onInc: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(Theme.Space.base)) {
        Text(label, color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 14.sp)
        Spacer(Modifier.weight(1f))
        val decInteraction = remember { MutableInteractionSource() }
        Text("−", color = Theme.fg2, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, modifier = Modifier.width(20.dp).clickable(interactionSource = decInteraction, indication = null) { onDec() })
        Text(value, color = Theme.fg1, fontFamily = ListenFonts.mono, fontSize = 13.sp, modifier = Modifier.width(56.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        val incInteraction = remember { MutableInteractionSource() }
        Text("+", color = Theme.fg2, fontFamily = ListenFonts.inter, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, modifier = Modifier.width(20.dp).clickable(interactionSource = incInteraction, indication = null) { onInc() })
    }
}

@Composable
private fun settingsField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    isSecure: Boolean = false,
    placeholder: String = "",
    keyboardType: KeyboardType = KeyboardType.Text,
    reveal: Boolean? = null,
    onToggleReveal: (() -> Unit)? = null,
) {
    Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Text(label, color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 13.sp)
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 15.sp) },
            textStyle = androidx.compose.ui.text.TextStyle(color = Theme.fg1, fontFamily = ListenFonts.inter, fontSize = 15.sp),
            singleLine = true,
            visualTransformation = if (isSecure && reveal != true) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = KeyboardOptions(keyboardType = if (isSecure) KeyboardType.Password else keyboardType),
            trailingIcon = if (onToggleReveal != null) {
                {
                    val interaction = remember { MutableInteractionSource() }
                    AppIcon(
                        if (reveal == true) IconName.EyeOff else IconName.Eye, size = 16.dp, color = Theme.fg3,
                        modifier = Modifier.clickable(interactionSource = interaction, indication = null) { onToggleReveal() },
                    )
                }
            } else null,
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Theme.bgBase, unfocusedContainerColor = Theme.bgBase,
                focusedIndicatorColor = Theme.lineQuiet, unfocusedIndicatorColor = Theme.lineQuiet,
                cursorColor = Theme.accent,
            ),
            shape = RoundedCornerShape(Theme.Radius.input),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
