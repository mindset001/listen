import SwiftUI

struct Chip: View {
    let label: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.inter(13, weight: .medium))
                .foregroundStyle(selected ? Theme.fg1 : Theme.fg2)
                .padding(.vertical, 8)
                .padding(.horizontal, 14)
                .background(selected ? Theme.accentWash : Color.clear)
                .overlay(
                    Capsule().stroke(selected ? Theme.accent : Theme.lineQuiet, lineWidth: 1)
                )
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
