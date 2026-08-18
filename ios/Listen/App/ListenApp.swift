import SwiftUI

@main
struct ListenApp: App {
    @State private var auth = AuthStore()
    @State private var library: LibraryStore
    @State private var toast = ToastCenter()
    @State private var player: PlayerStore

    init() {
        let library = LibraryStore()
        _library = State(initialValue: library)
        _player = State(initialValue: PlayerStore(library: library))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .environment(library)
                .environment(player)
                .environment(toast)
        }
    }
}
