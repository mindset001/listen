import SwiftUI

struct SavedAudioView: View {
    @Environment(LibraryStore.self) private var library
    @Environment(PlayerStore.self) private var player
    @Environment(ToastCenter.self) private var toast
    let openReader: (Document) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Space.base) {
                Text("Saved audio").font(.interTight(22)).foregroundStyle(Theme.fg1)

                VStack(spacing: 10) {
                    ForEach(library.documents) { doc in
                        let voiceName = MockData.voices.first { $0.id == doc.voice }?.name ?? doc.voice
                        HStack(spacing: 12) {
                            Button(action: {
                                openReader(doc)
                                player.play()
                            }) {
                                Icon(name: .play, size: 16, color: Theme.fg1)
                                    .frame(width: 40, height: 40)
                                    .overlay(Circle().stroke(Theme.lineStrong, lineWidth: 1))
                            }
                            .buttonStyle(.plain)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(doc.title).font(.inter(15, weight: .medium)).foregroundStyle(Theme.fg1).lineLimit(1)
                                Text("\(doc.duration) · \(voiceName) · \(doc.updatedLabel)")
                                    .font(.mono(12)).foregroundStyle(Theme.fg3)
                            }
                            Spacer()
                            Button(action: { toast.show(.success, "Download started") }) {
                                Icon(name: .download, size: 18, color: Theme.fg2)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(12)
                        .background(Theme.bgElevated)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.lineQuiet, lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .padding(Theme.Space.base)
            .padding(.bottom, 140)
        }
        .background(Theme.bgBase)
    }
}
