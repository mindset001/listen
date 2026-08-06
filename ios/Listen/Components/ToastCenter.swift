//
//  ToastCenter.swift
//  listen — bottom-anchored toasts (README "Toasts")
//
//  info -> info / lineStrong / fg2 · success -> check / success · error -> alert-triangle / caution
//

import SwiftUI
import Observation

enum ToastKind {
    case info, success, error

    var icon: IconName {
        switch self {
        case .info: return .info
        case .success: return .check
        case .error: return .alertTriangle
        }
    }

    var color: Color {
        switch self {
        case .info: return Theme.fg2
        case .success: return Theme.success
        case .error: return Theme.caution
        }
    }
}

struct Toast: Identifiable, Equatable {
    let id = UUID()
    let kind: ToastKind
    let message: String

    static func == (lhs: Toast, rhs: Toast) -> Bool { lhs.id == rhs.id }
}

@Observable
final class ToastCenter {
    private(set) var current: Toast?
    private var dismissTask: Task<Void, Never>?

    func show(_ kind: ToastKind, _ message: String) {
        dismissTask?.cancel()
        withAnimation(Theme.Motion.easeOut) { current = Toast(kind: kind, message: message) }
        dismissTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 3_200_000_000)
            guard !Task.isCancelled else { return }
            await MainActor.run { withAnimation(Theme.Motion.easeOut) { self?.current = nil } }
        }
    }
}

struct ToastOverlay: View {
    let toast: Toast?

    var body: some View {
        VStack {
            Spacer()
            if let toast {
                HStack(spacing: Theme.Space.sm) {
                    Icon(name: toast.kind.icon, size: 16, color: toast.kind.color)
                    Text(toast.message)
                        .font(.inter(13))
                        .foregroundStyle(Theme.fg1)
                        .lineLimit(2)
                }
                .padding(Theme.Space.base)
                .background(Theme.bgRaised)
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(toast.kind.color, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
                .padding(.horizontal, Theme.Space.lg)
                .padding(.bottom, 100)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .allowsHitTesting(false)
    }
}
