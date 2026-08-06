import SwiftUI

struct PrimaryButton: View {
    let label: String
    var disabled: Bool = false
    var loading: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Space.sm) {
                if loading {
                    ProgressView().tint(Theme.fg1)
                }
                Text(label)
                    .font(.inter(15, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .frame(maxWidth: .infinity, minHeight: 44)
            .padding(.vertical, 15)
            .background(disabled || loading ? Theme.lineStrong.opacity(0.7) : Theme.accent)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input, style: .continuous))
        }
        .disabled(disabled || loading)
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}
