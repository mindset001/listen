import SwiftUI

private enum AuthMode { case login, signup, forgot }

private struct AuthCopy {
    let title: String, sub: String, cta: String, switchLabel: String, switchCta: String, switchTo: AuthMode
}

private func copy(for mode: AuthMode) -> AuthCopy {
    switch mode {
    case .login:
        return AuthCopy(title: "Welcome back", sub: "Sign in to pick up where you left off.", cta: "Sign in",
                         switchLabel: "New here?", switchCta: "Create an account", switchTo: .signup)
    case .signup:
        return AuthCopy(title: "Create your account", sub: "Twenty thousand characters a month, free. No card needed.", cta: "Create account",
                         switchLabel: "Already have an account?", switchCta: "Sign in", switchTo: .login)
    case .forgot:
        return AuthCopy(title: "Reset your password", sub: "Enter your email and we will send you a reset link.", cta: "Send reset link",
                         switchLabel: "Remembered it?", switchCta: "Back to sign in", switchTo: .login)
    }
}

private let emailRegex = #"^[^@\s]+@[^@\s]+\.[^@\s]+$"#

struct AuthView: View {
    @Environment(ToastCenter.self) private var toast
    let onDone: () -> Void

    @State private var mode: AuthMode = .login
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var emailError = ""

    private var c: AuthCopy { copy(for: mode) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Space.sm) {
                HStack(spacing: 10) {
                    HStack(spacing: 2) {
                        RoundedRectangle(cornerRadius: 2).fill(Theme.accent).frame(width: 8, height: 3)
                        RoundedRectangle(cornerRadius: 2).fill(Theme.accent).frame(width: 14, height: 3)
                        RoundedRectangle(cornerRadius: 2).fill(Theme.accent).frame(width: 20, height: 3)
                    }
                    Text("listen").font(.interTight(18)).foregroundStyle(Theme.fg1)
                }
                .padding(.bottom, Theme.Space.xxl)

                Text(c.title).font(.interTight(26)).foregroundStyle(Theme.fg1)
                Text(c.sub).font(.inter(15)).foregroundStyle(Theme.fg2).padding(.bottom, Theme.Space.md)

                if mode == .signup {
                    field("Name", text: $name)
                }

                field("Email", text: $email, isError: !emailError.isEmpty)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .onChange(of: email) { _, _ in emailError = "" }
                if !emailError.isEmpty {
                    Text(emailError).font(.inter(12)).foregroundStyle(Theme.caution)
                }

                if mode != .forgot {
                    field("Password", text: $password, isSecure: true)
                }

                PrimaryButton(label: c.cta, action: submit).padding(.top, Theme.Space.sm)

                if mode != .forgot {
                    Button(action: { toast.show(.info, "Sign-in provider not connected in this preview") }) {
                        HStack(spacing: 8) {
                            Icon(name: .user, size: 16, color: Theme.fg2)
                            Text("Continue with Apple").font(.inter(14, weight: .medium)).foregroundStyle(Theme.fg1)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(Theme.lineQuiet, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .padding(.top, Theme.Space.sm)
                }

                HStack {
                    Spacer()
                    Text(c.switchLabel + " ").font(.inter(13)).foregroundStyle(Theme.fg2)
                    Button(action: { mode = c.switchTo; emailError = "" }) {
                        Text(c.switchCta).font(.inter(13, weight: .medium)).foregroundStyle(Theme.accent)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                }
                .padding(.top, Theme.Space.lg)

                if mode == .login {
                    Button(action: { mode = .forgot; emailError = "" }) {
                        Text("Forgot your password?")
                            .font(.inter(13)).foregroundStyle(Theme.fg3)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.plain)
                    .padding(.top, Theme.Space.sm)
                }
            }
            .padding(.horizontal, Theme.Space.lg)
            .padding(.top, Theme.Space.xxxl)
        }
        .background(Theme.bgBase)
        .navigationBarBackButtonHidden(true)
    }

    private func field(_ placeholder: String, text: Binding<String>, isSecure: Bool = false, isError: Bool = false) -> some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: text)
            } else {
                TextField(placeholder, text: text)
            }
        }
        .font(.inter(15))
        .foregroundStyle(Theme.fg1)
        .padding(14)
        .background(Theme.bgElevated)
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.input).stroke(isError ? Theme.caution : Theme.lineQuiet, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.input))
    }

    private func submit() {
        let trimmed = email.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty {
            emailError = "Enter your email address"
            return
        }
        if trimmed.range(of: emailRegex, options: .regularExpression) == nil {
            emailError = "That does not look like an email address"
            return
        }
        emailError = ""

        if mode == .forgot {
            toast.show(.success, "Check your email for a reset link")
            mode = .login
            return
        }

        if mode == .signup && password.count < 8 {
            toast.show(.error, "Passwords need at least 8 characters")
            return
        }

        onDone()
    }
}
