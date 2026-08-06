//
//  Theme.swift
//  listen — Cairn design tokens (port of lib/theme.js)
//
//  Dark-first. ONE accent: indigo. No gradients, no decorative shadows, no blur.
//  Depth comes from the background ladder: base -> elevated -> raised.
//

import SwiftUI

extension Color {
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s.removeAll { $0 == "#" }
        var rgb: UInt64 = 0
        Scanner(string: s).scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255
        let g = Double((rgb >> 8) & 0xFF) / 255
        let b = Double(rgb & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

enum Theme {
    // MARK: Colour
    static let bgBase = Color(hex: "0B0F19")
    static let bgElevated = Color(hex: "111727")
    static let bgRaised = Color(hex: "1A2235")

    static let fg1 = Color(hex: "E8EAF0")
    static let fg2 = Color(hex: "9BA3B4")
    static let fg3 = Color(hex: "5C6478")

    static let accent = Color(hex: "6366F1")
    static let accentHover = Color(hex: "7C7FF2")
    static let accentWash = Color(hex: "6366F1").opacity(0.10)

    static let success = Color(hex: "10B981")
    static let caution = Color(hex: "F59E0B")
    static let danger = Color(hex: "EF4444")

    static let lineQuiet = Color(hex: "1F2638")
    static let lineStrong = Color(hex: "2D3650")

    // MARK: Spacing — only these values, no intermediates.
    enum Space {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let base: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
        static let xxxl: CGFloat = 64
        static let section: CGFloat = 96
    }

    // MARK: Radius
    enum Radius {
        static let button: CGFloat = 6
        static let input: CGFloat = 8
        static let card: CGFloat = 12
        static let surface: CGFloat = 16
        static let pill: CGFloat = 999
    }

    // MARK: Motion
    enum Motion {
        static let hover: Double = 0.15
        static let tap: Double = 0.20
        static let dialog: Double = 0.30
        static let screen: Double = 0.40
        static let showcase: Double = 0.60
        static let easeOut = Animation.timingCurve(0.22, 1, 0.36, 1, duration: showcase)
        static let easeUI = Animation.timingCurve(0.4, 0, 0.2, 1, duration: tap)
    }

    static let hitSlopMin: CGFloat = 44
}

// MARK: - Type scale (Inter Tight for display/headings, Inter for body, JetBrains Mono for numerals)
extension Font {
    static func interTight(_ size: CGFloat, weight: Weight = .semibold) -> Font {
        switch weight {
        case .bold: return .custom("InterTight-Bold", size: size)
        case .medium: return .custom("InterTight-Medium", size: size)
        default: return .custom("InterTight-SemiBold", size: size)
        }
    }

    static func inter(_ size: CGFloat, weight: Weight = .regular) -> Font {
        switch weight {
        case .medium: return .custom("Inter-Medium", size: size)
        case .semibold: return .custom("Inter-SemiBold", size: size)
        default: return .custom("Inter-Regular", size: size)
        }
    }

    static func mono(_ size: CGFloat, weight: Weight = .regular) -> Font {
        switch weight {
        case .medium: return .custom("JetBrainsMono-Medium", size: size)
        case .semibold: return .custom("JetBrainsMono-SemiBold", size: size)
        default: return .custom("JetBrainsMono-Regular", size: size)
        }
    }

    // Scale: display 40 / h1 32 / h2 28 / h3 24 / bodyLg 19 / body 16 / bodySm 14 / caption 12 (mobile)
    static let displayTitle = Font.interTight(40)
    static let h1 = Font.interTight(32)
    static let h2 = Font.interTight(28)
    static let h3 = Font.interTight(24)
    static let bodyLg = Font.inter(19)
    static let bodyBase = Font.inter(16)
    static let bodySm = Font.inter(14)
    static let caption = Font.inter(12, weight: .medium)
}

/// Active-sentence treatment in the reader.
enum SentenceState {
    case read, active, upcoming

    var textColor: Color {
        switch self {
        case .read: return Theme.fg3
        case .active: return Theme.fg1
        case .upcoming: return Theme.fg2
        }
    }

    var background: Color {
        self == .active ? Theme.accentWash : .clear
    }

    var barColor: Color {
        self == .active ? Theme.accent : .clear
    }
}
