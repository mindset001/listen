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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.data.AuthViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.ui.components.PrimaryButton
import com.listen.app.ui.components.ToastCenter
import com.listen.app.ui.components.ToastKind
import kotlinx.coroutines.launch

private enum class AuthMode { LOGIN, SIGNUP, FORGOT }

private data class AuthCopy(
    val title: String, val sub: String, val cta: String,
    val switchLabel: String, val switchCta: String, val switchTo: AuthMode,
)

private fun copyFor(mode: AuthMode): AuthCopy = when (mode) {
    AuthMode.LOGIN -> AuthCopy(
        "Welcome back", "Sign in to pick up where you left off.", "Sign in",
        "New here?", "Create an account", AuthMode.SIGNUP,
    )
    AuthMode.SIGNUP -> AuthCopy(
        "Create your account", "Twenty thousand characters a month, free. No card needed.", "Create account",
        "Already have an account?", "Sign in", AuthMode.LOGIN,
    )
    AuthMode.FORGOT -> AuthCopy(
        "Reset your password", "Enter your email and we will send you a reset link.", "Send reset link",
        "Remembered it?", "Back to sign in", AuthMode.LOGIN,
    )
}

private val emailRegex = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+\$")

@Composable
fun AuthScreen(auth: AuthViewModel, toast: ToastCenter, onDone: () -> Unit) {
    var mode by remember { mutableStateOf(AuthMode.LOGIN) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val copy = copyFor(mode)

    fun submit() {
        val trimmed = email.trim()
        if (trimmed.isEmpty()) { emailError = "Enter your email address"; return }
        if (!emailRegex.matches(trimmed)) { emailError = "That does not look like an email address"; return }
        emailError = ""

        if (mode == AuthMode.FORGOT) {
            toast.show(ToastKind.INFO, "Password reset isn't wired up yet — sign in directly for now.", scope)
            return
        }
        if (mode == AuthMode.SIGNUP && password.length < 8) {
            toast.show(ToastKind.ERROR, "Passwords need at least 8 characters", scope)
            return
        }
        if (submitting) return
        submitting = true
        scope.launch {
            try {
                if (mode == AuthMode.SIGNUP) {
                    auth.signup(name, trimmed, password)
                    toast.show(ToastKind.SUCCESS, "Account created — welcome", scope)
                } else {
                    auth.login(trimmed, password)
                    toast.show(ToastKind.SUCCESS, "Signed in", scope)
                }
                onDone()
            } catch (e: Exception) {
                toast.show(ToastKind.ERROR, e.message ?: "Something went wrong. Try again.", scope)
            } finally {
                submitting = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Theme.bgBase)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Theme.Space.lg)
            .padding(top = 64.dp),
    ) {
        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = androidx.compose.ui.Alignment.Bottom) {
                listOf(8, 14, 20).forEach { w ->
                    androidx.compose.foundation.layout.Box(
                        modifier = Modifier.width(w.dp).height(3.dp).background(Theme.accent, RoundedCornerShape(2.dp)),
                    )
                }
            }
            Text("listen", color = Theme.fg1, fontFamily = ListenFonts.interTight, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
        }

        Spacer(Modifier.height(Theme.Space.xxl))

        Text(copy.title, color = Theme.fg1, fontFamily = ListenFonts.interTight, fontWeight = FontWeight.SemiBold, fontSize = 26.sp)
        Spacer(Modifier.height(4.dp))
        Text(copy.sub, color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 15.sp)
        Spacer(Modifier.height(Theme.Space.md))

        if (mode == AuthMode.SIGNUP) {
            AuthField(placeholder = "Name", value = name, onValueChange = { name = it })
            Spacer(Modifier.height(Theme.Space.sm))
        }

        AuthField(
            placeholder = "Email", value = email,
            onValueChange = { email = it; emailError = "" },
            keyboardType = KeyboardType.Email,
            isError = emailError.isNotEmpty(),
        )
        if (emailError.isNotEmpty()) {
            Spacer(Modifier.height(4.dp))
            Text(emailError, color = Theme.caution, fontFamily = ListenFonts.inter, fontSize = 12.sp)
        }

        if (mode != AuthMode.FORGOT) {
            Spacer(Modifier.height(Theme.Space.sm))
            AuthField(placeholder = "Password", value = password, onValueChange = { password = it }, isPassword = true)
        }

        Spacer(Modifier.height(Theme.Space.sm))
        PrimaryButton(
            label = if (submitting) "Please wait…" else copy.cta,
            disabled = submitting, loading = submitting,
            onClick = { submit() },
        )

        if (mode != AuthMode.FORGOT) {
            Spacer(Modifier.height(Theme.Space.sm))
            val appleInteraction = remember { MutableInteractionSource() }
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Theme.lineQuiet, RoundedCornerShape(Theme.Radius.input))
                    .clickable(interactionSource = appleInteraction, indication = null) {
                        toast.show(ToastKind.INFO, "Sign-in provider not connected in this preview", scope)
                    }
                    .padding(vertical = 13.dp),
            ) {
                AppIcon(IconName.User, size = 16.dp, color = Theme.fg2)
                Spacer(Modifier.width(8.dp))
                Text("Continue with Apple", color = Theme.fg1, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 14.sp)
            }
        }

        Spacer(Modifier.height(Theme.Space.lg))
        Row(horizontalArrangement = Arrangement.Center, modifier = Modifier.fillMaxWidth()) {
            Text(copy.switchLabel + " ", color = Theme.fg2, fontFamily = ListenFonts.inter, fontSize = 13.sp)
            val switchInteraction = remember { MutableInteractionSource() }
            Text(
                copy.switchCta,
                color = Theme.accent,
                fontFamily = ListenFonts.inter,
                fontWeight = FontWeight.Medium,
                fontSize = 13.sp,
                modifier = Modifier.clickable(interactionSource = switchInteraction, indication = null) {
                    mode = copy.switchTo
                    emailError = ""
                },
            )
        }

        if (mode == AuthMode.LOGIN) {
            Spacer(Modifier.height(Theme.Space.sm))
            val forgotInteraction = remember { MutableInteractionSource() }
            Text(
                "Forgot your password?",
                color = Theme.fg3,
                fontFamily = ListenFonts.inter,
                fontSize = 13.sp,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(interactionSource = forgotInteraction, indication = null) {
                        mode = AuthMode.FORGOT
                        emailError = ""
                    },
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }

        Spacer(Modifier.height(Theme.Space.xxl))
    }
}

@Composable
private fun AuthField(
    placeholder: String,
    value: String,
    onValueChange: (String) -> Unit,
    isPassword: Boolean = false,
    isError: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
) {
    TextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = Theme.fg3, fontFamily = ListenFonts.inter, fontSize = 15.sp) },
        textStyle = androidx.compose.ui.text.TextStyle(color = Theme.fg1, fontFamily = ListenFonts.inter, fontSize = 15.sp),
        singleLine = true,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = if (isPassword) KeyboardType.Password else keyboardType),
        colors = TextFieldDefaults.colors(
            focusedContainerColor = Theme.bgElevated,
            unfocusedContainerColor = Theme.bgElevated,
            focusedIndicatorColor = if (isError) Theme.caution else Theme.accent,
            unfocusedIndicatorColor = if (isError) Theme.caution else Theme.lineQuiet,
            cursorColor = Theme.accent,
        ),
        shape = RoundedCornerShape(Theme.Radius.input),
        modifier = Modifier.fillMaxWidth(),
    )
}
