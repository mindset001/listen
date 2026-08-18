import SwiftUI
import UniformTypeIdentifiers

private enum UploadStage { case idle, uploading, done }

private struct UploadResult: Decodable {
    let text: String
    let wordCount: Int
    let pageCount: Int
}

struct UploadView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ToastCenter.self) private var toast
    let onOpenInEditor: (String, String) -> Void

    @State private var stage: UploadStage = .idle
    @State private var pct: Double = 0
    @State private var fileName = ""
    @State private var result: UploadResult?
    @State private var showPicker = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.lg) {
                    switch stage {
                    case .idle:
                        Button(action: { showPicker = true }) {
                            VStack(spacing: 8) {
                                Icon(name: .fileUp, size: 22, color: Theme.accent)
                                Text("Choose a file").font(.inter(15, weight: .semibold)).foregroundStyle(Theme.fg1)
                                Text("TXT, PDF or DOCX · up to 20 MB").font(.inter(13)).foregroundStyle(Theme.fg2)
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

                    case .uploading:
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(fileName).font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1).lineLimit(1)
                                Spacer()
                                Text("\(Int(pct))%").font(.mono(13)).foregroundStyle(Theme.fg1)
                            }
                            ProgressBarView(value: pct, height: 4)
                            Text(pct < 90 ? "Uploading file" : "Extracting text")
                                .font(.inter(12)).foregroundStyle(Theme.fg3)
                        }
                        .padding(Theme.Space.base)
                        .background(Theme.bgElevated)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.lineQuiet, lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))

                    case .done:
                        if let result {
                            VStack(alignment: .leading, spacing: 8) {
                                Icon(name: .check, size: 20, color: Theme.success)
                                (
                                    Text("Extracted ").font(.inter(14)).foregroundStyle(Theme.fg2)
                                    + Text("\(result.wordCount.formatted()) words").font(.inter(14, weight: .semibold)).foregroundStyle(Theme.fg1)
                                    + Text(result.pageCount > 1 ? " from \(result.pageCount) pages. Review the text, then generate audio." : ". Review the text, then generate audio.")
                                        .font(.inter(14)).foregroundStyle(Theme.fg2)
                                )
                                PrimaryButton(label: "Open in editor") {
                                    dismiss()
                                    let title = (fileName as NSString).deletingPathExtension
                                    onOpenInEditor(title, result.text)
                                }
                                .padding(.top, Theme.Space.md)
                            }
                            .padding(Theme.Space.lg)
                            .background(Theme.bgElevated)
                            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.success, lineWidth: 1))
                            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
                        }
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
            .fileImporter(
                isPresented: $showPicker,
                allowedContentTypes: [.plainText, .pdf, UTType(filenameExtension: "docx") ?? .data],
                allowsMultipleSelection: false
            ) { result in
                switch result {
                case .success(let urls):
                    if let url = urls.first { startUpload(url) }
                case .failure(let error):
                    toast.show(.error, error.localizedDescription)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func startUpload(_ url: URL) {
        fileName = url.lastPathComponent
        stage = .uploading
        pct = 0

        guard url.startAccessingSecurityScopedResource() else {
            toast.show(.error, "Could not read that file.")
            stage = .idle
            return
        }

        let data: Data
        do {
            data = try Data(contentsOf: url)
        } catch {
            url.stopAccessingSecurityScopedResource()
            toast.show(.error, "Could not read that file.")
            stage = .idle
            return
        }
        url.stopAccessingSecurityScopedResource()

        if data.count > 20 * 1024 * 1024 {
            toast.show(.error, "That file is over the 20 MB limit.")
            stage = .idle
            return
        }

        // The upload itself is one request with no native progress signal
        // for the "extracting text" phase server-side does after it — a
        // synthetic tick alongside the real call, same as the web app.
        let progressTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 150_000_000)
                await MainActor.run { pct = min(90, pct + 9) }
            }
        }

        Task {
            defer { progressTask.cancel() }
            do {
                let uploaded: UploadResult = try await APIClient.shared.upload(
                    "/api/upload", fileData: data, filename: fileName, mimeType: mimeType(for: url.pathExtension)
                )
                pct = 100
                result = uploaded
                try? await Task.sleep(nanoseconds: 200_000_000)
                stage = .done
            } catch {
                stage = .idle
                toast.show(.error, error.localizedDescription)
            }
        }
    }

    private func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "pdf": return "application/pdf"
        case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        default: return "text/plain"
        }
    }
}
