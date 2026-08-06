import SwiftUI

struct ProgressBarView: View {
    var value: Double // 0...100
    var height: CGFloat = 3

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Theme.lineQuiet)
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Theme.accent)
                    .frame(width: geo.size.width * max(0, min(100, value)) / 100)
            }
        }
        .frame(height: height)
    }
}
