import SwiftUI

struct ReaderView: View {
    @Environment(PlayerStore.self) private var player
    @Environment(LibraryStore.self) private var library
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var activeIndex: Int { player.timing.indexAt(player.elapsed) }
    private var voiceName: String { library.voices.first { $0.id == player.voice }?.name ?? player.voice }

    var body: some View {
        VStack(spacing: 0) {
            if !player.focus {
                header
            } else {
                HStack {
                    Spacer()
                    Button(action: player.toggleFocus) {
                        Icon(name: .x, size: 18, color: Theme.fg2).padding(8)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, Theme.Space.base)
                .padding(.top, Theme.Space.sm)
            }

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(Array(player.timing.sentences.enumerated()), id: \.offset) { i, sentence in
                            let state: SentenceState = i < activeIndex ? .read : (i == activeIndex ? .active : .upcoming)
                            SentenceRow(text: sentence, state: state, fontSize: player.fontSize, lineHeight: player.lineHeight)
                                .id(i)
                                .onTapGesture { player.seekToSentence(i) }
                        }
                    }
                    .padding(Theme.Space.base)
                    .frame(width: UIScreen.main.bounds.width * player.measure, alignment: .leading)
                }
                .onChange(of: activeIndex) { _, newValue in
                    guard player.playing else { return }
                    withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.3)) {
                        proxy.scrollTo(newValue, anchor: UnitPoint(x: 0.5, y: 0.4))
                    }
                }
            }

            if !player.focus {
                controlsRow
            }

            playerBar
        }
        .background(Theme.bgBase)
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .onDisappear {
            if player.playing { player.pause() }
        }
    }

    private var header: some View {
        HStack {
            Button(action: { dismiss() }) {
                Icon(name: .chevronLeft, size: 22, color: Theme.fg1)
            }
            .buttonStyle(.plain)
            Spacer()
            Text("\(voiceName) · Segment \(player.segment) of \(player.totalSegments)")
                .font(.inter(12, weight: .medium)).tracking(0.96)
                .foregroundStyle(Theme.fg3)
            Spacer()
            Button(action: player.toggleFocus) {
                Icon(name: .focus, size: 18, color: Theme.fg2)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, Theme.Space.base)
        .frame(height: 48)
    }

    private var controlsRow: some View {
        HStack(spacing: 8) {
            pill(.focus, "Focus", action: player.toggleFocus)
            pill(.type, "A−", action: player.decFontSize)
            pill(.type, "A+", action: player.incFontSize)
            pill(.unfoldVertical, "Spacing", action: player.cycleLineHeight)
            pill(.unfoldHorizontal, "Width", action: player.cycleMeasure)
        }
        .padding(.horizontal, Theme.Space.base)
        .padding(.vertical, Theme.Space.sm)
        .overlay(Rectangle().fill(Theme.lineQuiet).frame(height: 1), alignment: .top)
    }

    private func pill(_ icon: IconName, _ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Icon(name: icon, size: 14, color: Theme.fg2)
                Text(label).font(.inter(11, weight: .medium)).foregroundStyle(Theme.fg2)
            }
            .padding(.vertical, 6).padding(.horizontal, 10)
            .overlay(Capsule().stroke(Theme.lineQuiet, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var playerBar: some View {
        VStack(spacing: 8) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.lineQuiet)
                    Capsule().fill(Theme.accent).frame(width: geo.size.width * player.timing.progress(player.elapsed))
                }
                .contentShape(Rectangle())
                .gesture(DragGesture(minimumDistance: 0).onChanged { value in
                    let pct = max(0, min(1, value.location.x / geo.size.width))
                    player.seek(player.timing.total * pct)
                })
            }
            .frame(height: 4)

            HStack {
                Text(Timing.formatTime(player.elapsed)).font(.mono(12)).foregroundStyle(Theme.fg3)
                Spacer()
                Text(Timing.formatTime(player.timing.total)).font(.mono(12)).foregroundStyle(Theme.fg3)
            }

            ZStack {
                HStack(spacing: Theme.Space.lg) {
                    Button(action: player.prev) { Icon(name: .skipBack, size: 22, color: Theme.fg1) }
                        .buttonStyle(.plain)
                    Button(action: { player.playing ? player.pause() : player.play() }) {
                        Icon(name: player.playing ? .pause : .play, size: 22, color: .white)
                            .frame(width: 52, height: 52)
                            .background(Theme.accent)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    Button(action: player.next) { Icon(name: .skipForward, size: 22, color: Theme.fg1) }
                        .buttonStyle(.plain)
                    Button(action: player.stop) { Icon(name: .stop, size: 20, color: Theme.fg2) }
                        .buttonStyle(.plain)
                }

                HStack {
                    Button(action: player.cycleSpeed) {
                        Text("\(formattedSpeed)x")
                            .font(.mono(12, weight: .medium)).foregroundStyle(Theme.fg2)
                            .padding(.vertical, 6).padding(.horizontal, 10)
                            .overlay(Capsule().stroke(Theme.lineQuiet, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    Spacer()
                }
            }
        }
        .padding(Theme.Space.base)
        .overlay(Rectangle().fill(Theme.lineQuiet).frame(height: 1), alignment: .top)
    }

    private var formattedSpeed: String {
        player.speed.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", player.speed) : String(player.speed)
    }
}

private struct SentenceRow: View {
    let text: String
    let state: SentenceState
    let fontSize: CGFloat
    let lineHeight: CGFloat

    var body: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(state.barColor)
                .frame(width: 2)
            Text(text)
                .font(.inter(fontSize))
                .lineSpacing((lineHeight - 1) * fontSize)
                .foregroundStyle(state.textColor)
                .padding(.vertical, 6)
                .padding(.leading, 12)
                .padding(.trailing, 10)
        }
        .background(state.background)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .animation(.easeInOut(duration: 0.2), value: state.textColor)
    }
}
