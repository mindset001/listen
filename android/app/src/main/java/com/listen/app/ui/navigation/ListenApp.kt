package com.listen.app.ui.navigation

/**
 * listen — top-level app state machine (port of ios/Listen/App/RootView.swift)
 *
 * No Navigation-Compose graph: the iOS original drives Reader/NewReading/
 * Upload as sheets pushed over a persistent tab view, and passing a full
 * Document straight through a state variable is simpler and safer than
 * threading it through nav-graph arguments, so this mirrors that with a
 * small manual state machine instead.
 */

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.listen.app.data.AuthViewModel
import com.listen.app.data.LibraryViewModel
import com.listen.app.data.PlayerViewModel
import com.listen.app.designsystem.AppIcon
import com.listen.app.designsystem.IconName
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme
import com.listen.app.models.Document
import com.listen.app.ui.components.MiniPlayerView
import com.listen.app.ui.components.ToastCenter
import com.listen.app.ui.components.ToastOverlay
import com.listen.app.ui.screens.AuthScreen
import com.listen.app.ui.screens.DashboardScreen
import com.listen.app.ui.screens.LibraryScreen
import com.listen.app.ui.screens.NewReadingScreen
import com.listen.app.ui.screens.ReaderScreen
import com.listen.app.ui.screens.SavedAudioScreen
import com.listen.app.ui.screens.SettingsScreen
import com.listen.app.ui.screens.SplashScreen
import com.listen.app.ui.screens.UploadScreen
import kotlinx.coroutines.launch

private enum class Tab(val label: String, val icon: IconName) {
    DASHBOARD("Dashboard", IconName.LayoutDashboard),
    LIBRARY("Library", IconName.Library),
    SAVED_AUDIO("Saved audio", IconName.Disc3),
    SETTINGS("Settings", IconName.Settings),
}

private data class UploadPrefill(val title: String, val text: String)

@Composable
fun ListenApp() {
    val auth: AuthViewModel = viewModel()
    val library: LibraryViewModel = viewModel()
    val player: PlayerViewModel = viewModel()
    val toast = remember { ToastCenter() }
    val scope = rememberCoroutineScope()

    var showSplash by remember { mutableStateOf(true) }
    var tab by remember { mutableStateOf(Tab.DASHBOARD) }
    var showReader by remember { mutableStateOf(false) }
    var showNewReading by remember { mutableStateOf(false) }
    var showUpload by remember { mutableStateOf(false) }
    var prefill by remember { mutableStateOf<UploadPrefill?>(null) }

    val user by auth.user.collectAsState()

    LaunchedEffect(Unit) {
        player.attachLibrary(library)
        auth.refresh()
    }

    fun loadLibraryAfterSignIn() {
        library.refresh()
        library.loadVoices()
    }

    LaunchedEffect(user) {
        if (user != null) loadLibraryAfterSignIn()
    }

    fun openReader(doc: Document) {
        scope.launch {
            player.loadDocument(doc)
            showReader = true
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Theme.bgBase)) {
        when {
            showSplash -> SplashScreen(onFinish = { showSplash = false })

            user == null -> AuthScreen(auth = auth, toast = toast, onDone = {})

            showReader -> ReaderScreen(player = player, library = library, onBack = { showReader = false })

            showNewReading -> NewReadingScreen(
                player = player,
                library = library,
                toast = toast,
                prefillTitle = prefill?.title,
                prefillText = prefill?.text,
                onDismiss = { showNewReading = false; prefill = null },
                onGenerated = { showNewReading = false; prefill = null; showReader = true },
            )

            showUpload -> UploadScreen(
                toast = toast,
                onDismiss = { showUpload = false },
                onOpenInEditor = { title, text ->
                    showUpload = false
                    prefill = UploadPrefill(title, text)
                    showNewReading = true
                },
            )

            else -> MainScaffold(
                tab = tab,
                onTabChange = { tab = it },
                auth = auth,
                library = library,
                player = player,
                toast = toast,
                openNewReading = { prefill = null; showNewReading = true },
                openUpload = { showUpload = true },
                openReader = ::openReader,
                pushReader = { showReader = true },
            )
        }

        ToastOverlay(toast.current)
    }
}

@Composable
private fun MainScaffold(
    tab: Tab,
    onTabChange: (Tab) -> Unit,
    auth: AuthViewModel,
    library: LibraryViewModel,
    player: PlayerViewModel,
    toast: ToastCenter,
    openNewReading: () -> Unit,
    openUpload: () -> Unit,
    openReader: (Document) -> Unit,
    pushReader: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().background(Theme.bgBase)) {
        Box(modifier = Modifier.weight(1f)) {
            when (tab) {
                Tab.DASHBOARD -> DashboardScreen(auth, library, openNewReading, openUpload, openReader)
                Tab.LIBRARY -> LibraryScreen(library, openReader)
                Tab.SAVED_AUDIO -> SavedAudioScreen(library, toast, openReader)
                Tab.SETTINGS -> SettingsScreen(player, auth, toast)
            }
        }

        MiniPlayerView(player = player, onOpen = pushReader)

        NavigationBar(containerColor = Theme.bgElevated) {
            Tab.entries.forEach { t ->
                NavigationBarItem(
                    selected = tab == t,
                    onClick = { onTabChange(t) },
                    icon = { AppIcon(t.icon, color = if (tab == t) Theme.accent else Theme.fg3) },
                    label = { Text(t.label, fontFamily = ListenFonts.inter, fontWeight = FontWeight.Medium, fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Theme.accent,
                        selectedTextColor = Theme.accent,
                        unselectedIconColor = Theme.fg3,
                        unselectedTextColor = Theme.fg3,
                        indicatorColor = Theme.accentWash,
                    ),
                )
            }
        }
    }
}
