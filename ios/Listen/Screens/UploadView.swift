import SwiftUI

private enum UploadStage { case idle, uploading, done }

private let recentUploads: [(name: String, size: String)] = [
    ("Meeting notes.docx", "1.2 MB"),
    ("Research summary.pdf", "640 KB"),
]

private let mockExtracted = """
The report outlines three findings from this quarter's user research. First, onboarding drop-off concentrates in the permissions step, not account creation as previously assumed. Second, users who complete a first document within the first session return at nearly twice the rate of those who do not. Third, the most requested feature by a wide margin is offline playback.

These findings suggest prioritising a lighter permissions flow and an explicit first-session prompt to generate one document, ahead of any new feature work.
"""

struct UploadView: View {
    @Environment(\.dismiss) private var dismiss
    let onOpenInEditor: (String, String) -> Void

    @State private var stage: UploadStage = .idle
    @State private var pct: Double = 0
    private let fileName = "Quarterly report.pdf"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.lg) {
                    switch stage {
                    case .idle:
                        Button(action: startUpload) {
                            VStack(spacing: 8) {
                                Icon(name: .fileUp, size: 22, color: Theme.accent)
                                Text("Choose a file").font(.inter(15, weight: .semibold)).foregroundStyle(Theme.fg1)
                                Text("Drop a file here, or choose one").font(.inter(13)).foregroundStyle(Theme.fg2)
                                Text("TXT, PDF or DOCX · up to 20 MB").font(.inter(12)).foregroundStyle(Theme.fg3)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 44)
                            .overlay(
                                RoundedRectangle(cornerRadius: Theme.Radius.card)
                                    .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [5]))
                                    .foregroundStyle(Theme.lineStrong)
                            )
                        }
                        .buttonStyle(.plain)

                        Text("RECENTLY UPLOADED").font(.inter(12, weight: .medium)).tracking(0.96).foregroundStyle(Theme.fg3)
                        VStack(spacing: 8) {
                            ForEach(recentUploads, id: \.name) { f in
                                HStack(spacing: 10) {
                                    Icon(name: .fileText, size: 16, color: Theme.fg2)
                                    Text(f.name).font(.inter(13)).foregroundStyle(Theme.fg1).lineLimit(1)
                                    Spacer()
                                    Text(f.size).font(.mono(12)).foregroundStyle(Theme.fg3)
                                }
                                .padding(12)
                                .background(Theme.bgElevated)
                                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
                                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input))
                            }
                        }

                    case .uploading:
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(fileName).font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1).lineLimit(1)
                                Spacer()
                                Text("\(Int(pct))%").font(.mono(13)).foregroundStyle(Theme.fg1)
                            }
                            ProgressBarView(value: pct, height: 4)
                            Text(pct < 55 ? "Uploading file" : "Extracting text from 9 pages")
                                .font(.inter(12)).foregroundStyle(Theme.fg3)
                        }
                        .padding(Theme.Space.base)
                        .background(Theme.bgElevated)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.lineQuiet, lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))

                    case .done:
                        VStack(alignment: .leading, spacing: 8) {
                            Icon(name: .check, size: 20, color: Theme.success)
                            (
                                Text("Extracted ").font(.inter(14)).foregroundStyle(Theme.fg2)
                                + Text("4,180 words").font(.inter(14, weight: .semibold)).foregroundStyle(Theme.fg1)
                                + Text(" from 9 pages. Review the text, then generate audio.")
                                    .font(.inter(14)).foregroundStyle(Theme.fg2)
                            )
                            PrimaryButton(label: "Open in editor") {
                                dismiss()
                                onOpenInEditor(fileName.replacingOccurrences(of: #"\.(pdf|docx|txt)$"#, with: "", options: .regularExpression), mockExtracted)
                            }
                            .padding(.top, Theme.Space.md)
                        }
                        .padding(Theme.Space.lg)
                        .background(Theme.bgElevated)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.success, lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
                    }
                }
                .padding(Theme.Space.base)
            }
            .background(Theme.bgBase)
            .navigationTitle("Upload")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Icon(name: .chevronLeft, size: 20, color: Theme.fg1) }
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func startUpload() {
        stage = .uploading
        pct = 0
        Task {
            while pct < 100 {
                try? await Task.sleep(nanoseconds: 180_000_000)
                pct = min(100, pct + 9)
            }
            stage = .done
        }
    }
}
