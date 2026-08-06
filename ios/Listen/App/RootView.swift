import SwiftUI

enum Route: Hashable {
    case reader
    case auth
}

struct UploadPrefill: Equatable {
    var title: String
    var text: String
}

struct RootView: View {
    @Environment(PlayerStore.self) private var player
    @Environment(LibraryStore.self) private var library
    @Environment(ToastCenter.self) private var toast

    @State private var showSplash = true
    @State private var path = NavigationPath()
    @State private var showNewReading = false
    @State private var showUpload = false
    @State private var newReadingPrefill: UploadPrefill?

    var body: some View {
        ZStack {
            if showSplash {
                SplashView(onFinish: { withAnimation { showSplash = false } })
                    .transition(.opacity)
            } else {
                NavigationStack(path: $path) {
                    MainTabView(
                        openNewReading: { newReadingPrefill = nil; showNewReading = true },
                        openUpload: { showUpload = true },
                        openReader: { doc in player.loadDocument(doc); path.append(Route.reader) },
                        pushReader: { path.append(Route.reader) }
                    )
                    .navigationDestination(for: Route.self) { route in
                        switch route {
                        case .reader:
                            ReaderView()
                        case .auth:
                            AuthView(onDone: { path.removeLast(path.count) })
                        }
                    }
                }
                .tint(Theme.accent)
                .transition(.opacity)
            }

            ToastOverlay(toast: toast.current)
        }
        .background(Theme.bgBase)
        .preferredColorScheme(.dark)
        .sheet(isPresented: $showNewReading) {
            NewReadingView(prefill: newReadingPrefill, onGenerated: {
                showNewReading = false
                path.append(Route.reader)
            })
        }
        .sheet(isPresented: $showUpload) {
            UploadView(onOpenInEditor: { title, text in
                showUpload = false
                newReadingPrefill = UploadPrefill(title: title, text: text)
                showNewReading = true
            })
        }
    }
}

private struct MainTabView: View {
    @Environment(PlayerStore.self) private var player
    let openNewReading: () -> Void
    let openUpload: () -> Void
    let openReader: (Document) -> Void
    let pushReader: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView {
                DashboardView(openNewReading: openNewReading, openUpload: openUpload, openReader: openReader)
                    .tabItem { Label("Dashboard", systemImage: "square.grid.2x2") }

                LibraryView(openReader: openReader)
                    .tabItem { Label("Library", systemImage: "books.vertical") }

                SavedAudioView(openReader: openReader)
                    .tabItem { Label("Saved audio", systemImage: "opticaldiscdrive") }

                SettingsView()
                    .tabItem { Label("Settings", systemImage: "gearshape") }
            }
            .tint(Theme.accent)

            MiniPlayerView(onOpen: pushReader)
                .padding(.bottom, 50)
        }
    }
}
