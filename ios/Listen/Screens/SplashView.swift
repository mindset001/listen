import SwiftUI

private let barHeights: [CGFloat] = [14, 42, 72, 42, 22]
private let barWidth: CGFloat = 8
private let barGap: CGFloat = 7
private let stepMs = 320

private func statusFor(_ step: Int) -> String {
    if step <= 2 { return "Loading voices" }
    if step <= 4 { return "Restoring your place" }
    return "Ready"
}

struct SplashView: View {
    let onFinish: () -> Void

    @State private var step = 0
    @State private var barProgress: [CGFloat] = Array(repeating: 0, count: barHeights.count)
    @State private var wordmarkOpacity: Double = 0
    @State private var navigated = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: 20) {
            HStack(alignment: .bottom, spacing: barGap) {
                ForEach(barHeights.indices, id: \.self) { i in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(i == 2 ? Theme.accent : Theme.lineStrong)
                        .frame(width: barWidth, height: 8 + (barHeights[i] - 8) * barProgress[i])
                        .opacity(0.25 + 0.75 * barProgress[i])
                }
            }
            .frame(height: 72, alignment: .bottom)

            Text("listen")
                .font(.interTight(40))
                .foregroundStyle(Theme.fg1)
                .opacity(wordmarkOpacity)

            Text("Your reading list, out loud.")
                .font(.inter(16))
                .foregroundStyle(Theme.fg2)

            VStack(spacing: 4) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Theme.lineQuiet)
                        Capsule().fill(Theme.accent)
                            .frame(width: geo.size.width * min(1, CGFloat(step) * 0.2))
                    }
                }
                .frame(width: 140, height: 2)

                Text(statusFor(step).uppercased())
                    .font(.inter(12, weight: .medium))
                    .tracking(0.96)
                    .foregroundStyle(Theme.fg3)
            }
            .padding(.top, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bgBase)
        .contentShape(Rectangle())
        .onTapGesture { finish() }
        .onAppear { start() }
    }

    private func start() {
        for i in barHeights.indices {
            let delay = reduceMotion ? 0 : Double(i) * 0.08
            if reduceMotion {
                barProgress[i] = 1
            } else {
                withAnimation(Theme.Motion.easeOut.delay(delay)) { barProgress[i] = 1 }
            }
        }

        Task {
            while step < 6 {
                try? await Task.sleep(nanoseconds: UInt64(stepMs) * 1_000_000)
                step += 1
                if step == 4 {
                    withAnimation(reduceMotion ? nil : .easeOut(duration: 0.6)) { wordmarkOpacity = 1 }
                }
            }
            try? await Task.sleep(nanoseconds: UInt64(stepMs) * 1_000_000)
            finish()
        }
    }

    private func finish() {
        guard !navigated else { return }
        navigated = true
        onFinish()
    }
}
