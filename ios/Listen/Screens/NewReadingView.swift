import SwiftUI

struct NewReadingView: View {
    @Environment(PlayerStore.self) private var player
    @Environment(LibraryStore.self) private var library
    @Environment(ToastCenter.self) private var toast
    @Environment(\.dismiss) private var dismiss

    var prefill: UploadPrefill?
    let onGenerated: () -> Void

    @State private var title = ""
    @State private var text = ""
    @State private var voice = ""
    @State private var speedIndex = Timing.speeds.firstIndex(of: 1) ?? 2
    @State private var tone = MockData.tones[0]

    private var chars: Int { text.count }
    private var words: Int { Timing.wordCount(text) }
    private var segments: Int { max(2, Int((Double(chars) / 900).rounded(.up))) }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.Space.md) {
                        TextField("Enter document title", text: $title)
                            .font(.interTight(16))
                            .foregroundStyle(Theme.fg1)
                            .padding(14)
                            .background(Theme.bgElevated)
                            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
                            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input))

                        ZStack(alignment: .topLeading) {
                            if text.isEmpty {
                                Text("Paste or type the text you want read aloud.")
                                    .font(.inter(15)).foregroundStyle(Theme.fg3)
                                    .padding(.top, 8).padding(.leading, 5)
                            }
                            TextEditor(text: $text)
                                .font(.inter(15))
                                .foregroundStyle(Theme.fg1)
                                .scrollContentBackground(.hidden)
                                .frame(minHeight: 180)
                        }
                        .padding(10)
                        .background(Theme.bgElevated)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input))

                        HStack {
                            Text("\(chars) characters · \(words) words")
                                .font(.mono(12)).foregroundStyle(Theme.fg3)
                            Spacer()
                            HStack(spacing: 8) {
                                iconButton(.copy) { UIPasteboard.general.string = text; toast.show(.success, "Copied") }
                                iconButton(.save) { toast.show(.success, "Saved") }
                                iconButton(.trash, danger: true) { text = "" }
                            }
                        }

                        sectionLabel("Voice")
                        VStack(spacing: 6) {
                            ForEach(library.voices) { v in
                                Button(action: { voice = v.id }) {
                                    HStack(spacing: 10) {
                                        ZStack {
                                            Circle().fill(Theme.bgRaised).frame(width: 28, height: 28)
                                            Text(String(v.name.first ?? "?")).font(.inter(13, weight: .semibold)).foregroundStyle(Theme.fg1)
                                        }
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(v.name).font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1)
                                            Text(v.note).font(.inter(12)).foregroundStyle(Theme.fg3)
                                        }
                                        Spacer()
                                        if voice == v.id { Icon(name: .check, size: 18, color: Theme.accent) }
                                    }
                                    .padding(10)
                                    .background(voice == v.id ? Theme.accentWash : Color.clear)
                                    .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(voice == v.id ? Theme.accent : .clear, lineWidth: 1))
                                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input))
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        HStack {
                            sectionLabel("Speed")
                            Spacer()
                            Text("\(formattedSpeed)x").font(.mono(13)).foregroundStyle(Theme.fg1)
                        }
                        .padding(.top, Theme.Space.md)

                        speedStepper
                        HStack {
                            Text("0.5x").font(.inter(11)).foregroundStyle(Theme.fg3)
                            Spacer()
                            Text("1x").font(.inter(11)).foregroundStyle(Theme.fg3)
                            Spacer()
                            Text("2x").font(.inter(11)).foregroundStyle(Theme.fg3)
                        }

                        sectionLabel("Tone").padding(.top, Theme.Space.lg)
                        FlowChips(items: MockData.tones, selected: tone) { tone = $0 }
                        Text("Tone options come from the selected voice model.")
                            .font(.inter(12)).foregroundStyle(Theme.fg3)

                        if chars > 900 {
                            HStack(alignment: .top, spacing: 10) {
                                Icon(name: .layers, size: 18, color: Theme.fg2)
                                Text("This text is longer than one request allows. It will be split into ")
                                    .font(.inter(13)).foregroundStyle(Theme.fg2)
                                + Text("\(segments) segments").font(.inter(13, weight: .semibold)).foregroundStyle(Theme.fg1)
                                + Text(" at paragraph breaks and played back as one continuous session.")
                                    .font(.inter(13)).foregroundStyle(Theme.fg2)
                            }
                            .padding(Theme.Space.base)
                            .background(Theme.bgElevated)
                            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.lineStrong, lineWidth: 1))
                            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
                        }
                    }
                    .padding(Theme.Space.base)
                }

                VStack(spacing: Theme.Space.sm) {
                    PrimaryButton(
                        label: player.generating ? "Generating your audio" : "Generate audio",
                        disabled: player.generating, loading: player.generating,
                        action: generate
                    )
                    if player.generating {
                        ProgressBarView(value: player.genPct, height: 4)
                    }
                }
                .padding(Theme.Space.base)
                .background(Theme.bgBase)
                .overlay(Rectangle().fill(Theme.lineQuiet).frame(height: 1), alignment: .top)
            }
            .background(Theme.bgBase)
            .navigationTitle("New reading")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Theme.bgBase, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Icon(name: .chevronLeft, size: 20, color: Theme.fg1) }
                }
            }
            .onAppear {
                if let prefill {
                    title = prefill.title
                    text = prefill.text
                }
                if voice.isEmpty, let first = library.voices.first {
                    voice = first.id
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private var formattedSpeed: String {
        let v = Timing.speeds[speedIndex]
        return v.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", v) : String(v)
    }

    private var speedStepper: some View {
        HStack(spacing: 0) {
            ForEach(Timing.speeds.indices, id: \.self) { i in
                Button(action: { speedIndex = i }) {
                    Circle()
                        .fill(i <= speedIndex ? Theme.accent : Theme.lineStrong)
                        .frame(width: 10, height: 10)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .frame(height: 28)
        .background(alignment: .center) {
            Rectangle().fill(Theme.lineQuiet).frame(height: 2)
        }
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.inter(12, weight: .medium)).tracking(0.96)
            .foregroundStyle(Theme.fg3)
    }

    private func iconButton(_ icon: IconName, danger: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Icon(name: icon, size: 15, color: Theme.fg2)
                .frame(width: 32, height: 32)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.lineQuiet, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func generate() {
        Task {
            do {
                _ = try await player.generate(title: title, content: text, voice: voice, speed: Timing.speeds[speedIndex], tone: tone)
                toast.show(.success, "Audio ready")
                onGenerated()
            } catch {
                if let err = error as? GenerateError, err.errorDescription == nil { return }
                toast.show(.error, error.localizedDescription)
            }
        }
    }
}

/// Wrapping pill-chip layout for the tone list.
struct FlowChips: View {
    let items: [String]
    let selected: String
    let onSelect: (String) -> Void

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(items, id: \.self) { item in
                Chip(label: item, selected: item == selected) { onSelect(item) }
            }
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 {
                x = 0; y += rowHeight + spacing; rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: width, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX; y += rowHeight + spacing; rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
