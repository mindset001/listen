import SwiftUI

private struct SwitchRow: Identifiable {
    let id: String
    let label: String
    let note: String
    let key: WritableKeyPath<PlaybackSwitches, Bool>
}

private let switchRows: [SwitchRow] = [
    SwitchRow(id: "autoContinue", label: "Continue to next segment", note: "Play the next segment automatically when one finishes.", key: \.autoContinue),
    SwitchRow(id: "followText", label: "Scroll to the active sentence", note: "Keep the reader following along while audio plays.", key: \.followText),
    SwitchRow(id: "resume", label: "Remember where you stopped", note: "Reopen a document at the last sentence you heard.", key: \.resume),
    SwitchRow(id: "wifiOnly", label: "Download over Wi-Fi only", note: "Avoid using mobile data for saved audio.", key: \.wifiOnly),
]

struct SettingsView: View {
    @Environment(PlayerStore.self) private var player

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Space.xl) {
                Text("Settings").font(.interTight(22)).foregroundStyle(Theme.fg1)

                group("Reading") {
                    sliderRow("Text size", value: "\(Int(player.fontSize))px", onDec: player.decFontSize, onInc: player.incFontSize)
                    divider
                    sliderRow("Line spacing", value: String(format: "%.2f", player.lineHeight), onDec: player.cycleLineHeight, onInc: player.cycleLineHeight)
                    divider
                    sliderRow("Reading width", value: "\(Int(player.measure * 100))%", onDec: player.cycleMeasure, onInc: player.cycleMeasure)
                }

                group("Playback") {
                    ForEach(Array(switchRows.enumerated()), id: \.element.id) { idx, row in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(row.label).font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1)
                                Text(row.note).font(.inter(12)).foregroundStyle(Theme.fg3)
                            }
                            Spacer()
                            Toggle("", isOn: Binding(
                                get: { player.switches[keyPath: row.key] },
                                set: { _ in player.toggleSwitch(row.key) }
                            ))
                            .labelsHidden()
                            .tint(Theme.accent)
                        }
                        .padding(Theme.Space.base)
                        if idx < switchRows.count - 1 { divider }
                    }
                }

                group("Account") {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle().fill(Theme.bgRaised).frame(width: 40, height: 40)
                            Text("S").font(.inter(16, weight: .semibold)).foregroundStyle(Theme.fg1)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(verbatim: "Sam").font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1)
                            Text(verbatim: "sam@example.com").font(.inter(12)).foregroundStyle(Theme.fg3)
                        }
                        Spacer()
                    }
                    .padding(Theme.Space.base)
                    divider
                    NavigationLink(value: Route.auth) {
                        Text("Log out")
                            .font(.inter(14, weight: .semibold)).foregroundStyle(Theme.danger)
                            .frame(maxWidth: .infinity)
                            .padding(Theme.Space.base)
                    }
                }
            }
            .padding(Theme.Space.base)
            .padding(.bottom, 140)
        }
        .background(Theme.bgBase)
    }

    private var divider: some View {
        Rectangle().fill(Theme.lineQuiet).frame(height: 1)
    }

    private func group<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased()).font(.inter(12, weight: .medium)).tracking(0.96).foregroundStyle(Theme.fg3)
            VStack(spacing: 0, content: content)
                .background(Theme.bgElevated)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        }
    }

    private func sliderRow(_ label: String, value: String, onDec: @escaping () -> Void, onInc: @escaping () -> Void) -> some View {
        HStack {
            Text(label).font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1)
            Spacer()
            Button(action: onDec) { Text("−").font(.inter(16, weight: .semibold)).foregroundStyle(Theme.fg2).frame(width: 20) }
                .buttonStyle(.plain)
            Text(value).font(.mono(13)).foregroundStyle(Theme.fg1).frame(minWidth: 48)
            Button(action: onInc) { Text("+").font(.inter(16, weight: .semibold)).foregroundStyle(Theme.fg2).frame(width: 20) }
                .buttonStyle(.plain)
        }
        .padding(Theme.Space.base)
    }
}
