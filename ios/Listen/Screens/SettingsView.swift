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

private let emailRegex = #"^[^@\s]+@[^@\s]+\.[^@\s]+$"#

struct SettingsView: View {
    @Environment(PlayerStore.self) private var player
    @Environment(AuthStore.self) private var auth
    @Environment(ToastCenter.self) private var toast

    // profile
    @State private var profileName = ""
    @State private var profileEmail = ""
    @State private var profileCurrentPassword = ""
    @State private var profileError: String?
    @State private var profileSubmitting = false

    // password
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var passwordVisible = false
    @State private var passwordError: String?
    @State private var passwordSubmitting = false

    // danger zone
    @State private var deleteOpen = false
    @State private var deletePassword = ""
    @State private var deleteSubmitting = false

    private var emailChanged: Bool {
        profileEmail.trimmingCharacters(in: .whitespaces).lowercased() != auth.user?.email
    }
    private var profileDirty: Bool {
        profileName.trimmingCharacters(in: .whitespaces) != auth.user?.name || emailChanged
    }

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
                            Text(String((auth.user?.name.first).map(String.init) ?? "?")).font(.inter(16, weight: .semibold)).foregroundStyle(Theme.fg1)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(auth.user?.name ?? "").font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1)
                            Text(auth.user?.email ?? "").font(.inter(12)).foregroundStyle(Theme.fg3)
                        }
                        Spacer()
                    }
                    .padding(Theme.Space.base)
                    divider
                    Button(action: { Task { await auth.logout() } }) {
                        Text("Log out")
                            .font(.inter(14, weight: .semibold)).foregroundStyle(Theme.danger)
                            .frame(maxWidth: .infinity)
                            .padding(Theme.Space.base)
                    }
                    .buttonStyle(.plain)
                }

                sectionLabel("Profile")
                VStack(alignment: .leading, spacing: Theme.Space.md) {
                    field("Name", text: $profileName)
                    field("Email", text: $profileEmail, keyboard: .emailAddress)
                    if emailChanged, auth.user?.hasPassword == true {
                        field("Current password", text: $profileCurrentPassword, isSecure: true,
                              placeholder: "Required to change your email")
                    }
                    if let profileError {
                        Text(profileError).font(.inter(13)).foregroundStyle(Theme.caution)
                    }
                    HStack {
                        Spacer()
                        PrimaryButton(
                            label: profileSubmitting ? "Saving…" : "Save changes",
                            disabled: !profileDirty || profileSubmitting,
                            loading: profileSubmitting,
                            action: submitProfile
                        )
                        .frame(width: 160)
                    }
                }
                .padding(Theme.Space.base)
                .background(Theme.bgElevated)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))

                sectionLabel("Password")
                VStack(alignment: .leading, spacing: Theme.Space.md) {
                    if auth.user?.hasPassword != true {
                        Text("You signed in with Google and don't have a password yet. Set one to also be able to sign in with your email.")
                            .font(.inter(13)).foregroundStyle(Theme.fg3)
                    }
                    if auth.user?.hasPassword == true {
                        field("Current password", text: $currentPassword, isSecure: true, reveal: passwordVisible) {
                            passwordVisible.toggle()
                        }
                    }
                    field("New password", text: $newPassword, isSecure: true, placeholder: "At least 8 characters",
                          reveal: passwordVisible) { passwordVisible.toggle() }
                    field("Confirm new password", text: $confirmPassword, isSecure: !passwordVisible)
                    if let passwordError {
                        Text(passwordError).font(.inter(13)).foregroundStyle(Theme.caution)
                    }
                    HStack {
                        Spacer()
                        PrimaryButton(
                            label: passwordSubmitting ? "Saving…" : (auth.user?.hasPassword == true ? "Update password" : "Set password"),
                            disabled: passwordSubmitting,
                            loading: passwordSubmitting,
                            action: submitPassword
                        )
                        .frame(width: 180)
                    }
                }
                .padding(Theme.Space.base)
                .background(Theme.bgElevated)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))

                sectionLabel("Danger zone")
                VStack(alignment: .leading, spacing: Theme.Space.md) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Delete account").font(.inter(15, weight: .medium)).foregroundStyle(Theme.fg1)
                            Text("Permanently deletes your account, documents and generated audio. This can't be undone.")
                                .font(.inter(13)).foregroundStyle(Theme.fg3)
                        }
                        Spacer()
                        if !deleteOpen {
                            Button("Delete account") { deleteOpen = true }
                                .font(.inter(13)).foregroundStyle(Theme.fg1)
                                .padding(.horizontal, 14).padding(.vertical, 9)
                                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).stroke(Theme.lineStrong, lineWidth: 1))
                        }
                    }
                    if deleteOpen {
                        Divider().overlay(Theme.lineQuiet)
                        if auth.user?.hasPassword == true {
                            field("Enter your password to confirm", text: $deletePassword, isSecure: true)
                        }
                        HStack(spacing: 8) {
                            Spacer()
                            Button("Cancel") { deleteOpen = false; deletePassword = "" }
                                .font(.inter(13)).foregroundStyle(Theme.fg1)
                                .padding(.horizontal, 14).padding(.vertical, 9)
                                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).stroke(Theme.lineStrong, lineWidth: 1))
                            Button(action: { Task { await confirmDelete() } }) {
                                HStack(spacing: 7) {
                                    if deleteSubmitting { ProgressView().tint(.white) }
                                    Text(deleteSubmitting ? "Deleting…" : "Permanently delete my account")
                                }
                                .font(.inter(13, weight: .medium)).foregroundStyle(.white)
                                .padding(.horizontal, 14).padding(.vertical, 9)
                                .background(Theme.danger)
                                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button))
                            }
                            .buttonStyle(.plain)
                            .disabled(deleteSubmitting)
                        }
                    }
                }
                .padding(Theme.Space.base)
                .background(Theme.bgElevated)
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(deleteOpen ? Theme.danger : Theme.lineQuiet, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
            }
            .padding(Theme.Space.base)
            .padding(.bottom, 140)
        }
        .background(Theme.bgBase)
        .onAppear {
            profileName = auth.user?.name ?? ""
            profileEmail = auth.user?.email ?? ""
        }
    }

    private var divider: some View {
        Rectangle().fill(Theme.lineQuiet).frame(height: 1)
    }

    private func group<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionLabel(title)
            VStack(spacing: 0, content: content)
                .background(Theme.bgElevated)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        }
    }

    private func sectionLabel(_ title: String) -> some View {
        Text(title.uppercased()).font(.inter(12, weight: .medium)).tracking(0.96).foregroundStyle(Theme.fg3)
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

    private func field(
        _ label: String, text: Binding<String>, isSecure: Bool = false, placeholder: String = "",
        keyboard: UIKeyboardType = .default, reveal: Bool? = nil, onToggleReveal: (() -> Void)? = nil
    ) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(label).font(.inter(13)).foregroundStyle(Theme.fg2)
            ZStack(alignment: .trailing) {
                Group {
                    if isSecure && reveal != true {
                        SecureField(placeholder, text: text)
                    } else {
                        TextField(placeholder, text: text)
                    }
                }
                .font(.inter(15))
                .foregroundStyle(Theme.fg1)
                .keyboardType(keyboard)
                .textInputAutocapitalization(keyboard == .emailAddress ? .never : .sentences)
                .padding(14)
                .padding(.trailing, onToggleReveal != nil ? 36 : 0)
                .background(Theme.bgBase)
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input))

                if let onToggleReveal {
                    Button(action: onToggleReveal) {
                        Icon(name: reveal == true ? .eyeOff : .eye, size: 16, color: Theme.fg3)
                            .frame(width: 32, height: 32)
                    }
                    .buttonStyle(.plain)
                    .padding(.trailing, 4)
                }
            }
        }
    }

    private func submitProfile() {
        profileError = nil
        let name = profileName.trimmingCharacters(in: .whitespaces)
        let email = profileEmail.trimmingCharacters(in: .whitespaces)

        if name.isEmpty { profileError = "Name can't be empty."; return }
        if emailChanged, email.range(of: emailRegex, options: .regularExpression) == nil {
            profileError = "That does not look like an email address."
            return
        }
        if emailChanged, auth.user?.hasPassword == true, profileCurrentPassword.isEmpty {
            profileError = "Enter your current password to change your email."
            return
        }

        profileSubmitting = true
        Task {
            defer { profileSubmitting = false }
            do {
                try await auth.updateProfile(
                    name: name, email: email,
                    currentPassword: profileCurrentPassword.isEmpty ? nil : profileCurrentPassword
                )
                profileCurrentPassword = ""
                toast.show(.success, "Profile updated")
            } catch {
                profileError = error.localizedDescription
            }
        }
    }

    private func submitPassword() {
        passwordError = nil

        if auth.user?.hasPassword == true, currentPassword.isEmpty {
            passwordError = "Enter your current password."
            return
        }
        if newPassword.count < 8 {
            passwordError = "Passwords need at least 8 characters."
            return
        }
        if newPassword != confirmPassword {
            passwordError = "Passwords do not match."
            return
        }

        passwordSubmitting = true
        Task {
            defer { passwordSubmitting = false }
            do {
                try await auth.changePassword(
                    currentPassword: currentPassword.isEmpty ? nil : currentPassword,
                    newPassword: newPassword
                )
                currentPassword = ""; newPassword = ""; confirmPassword = ""
                toast.show(.success, auth.user?.hasPassword == true ? "Password updated" : "Password set")
            } catch {
                passwordError = error.localizedDescription
            }
        }
    }

    private func confirmDelete() async {
        if auth.user?.hasPassword == true, deletePassword.isEmpty {
            toast.show(.error, "Enter your password to confirm.")
            return
        }
        deleteSubmitting = true
        defer { deleteSubmitting = false }
        do {
            try await auth.deleteAccount(password: deletePassword.isEmpty ? nil : deletePassword)
            toast.show(.info, "Account deleted")
        } catch {
            toast.show(.error, error.localizedDescription)
        }
    }
}
