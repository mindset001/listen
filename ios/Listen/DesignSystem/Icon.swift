//
//  Icon.swift
//  listen — maps the Lucide icon names used in the design spec to SF Symbols.
//

import SwiftUI

enum IconName: String {
    case audioLines = "audio-lines"
    case menu, plus, x
    case chevronRight = "chevron-right"
    case chevronLeft = "chevron-left"
    case penLine = "pen-line"
    case fileUp = "file-up"
    case fileText = "file-text"
    case layers
    case search
    case settings
    case logOut = "log-out"
    case layoutDashboard = "layout-dashboard"
    case library
    case disc3 = "disc-3"
    case check
    case copy
    case save
    case trash = "trash-2"
    case pencil
    case download
    case focus
    case type
    case unfoldVertical = "unfold-vertical"
    case unfoldHorizontal = "unfold-horizontal"
    case alertTriangle = "alert-triangle"
    case info
    case clock
    case play
    case pause
    case stop = "square"
    case skipBack = "skip-back"
    case skipForward = "skip-forward"
    case heart
    case mail
    case user

    var symbolName: String {
        switch self {
        case .audioLines: return "waveform"
        case .menu: return "line.3.horizontal"
        case .plus: return "plus"
        case .x: return "xmark"
        case .chevronRight: return "chevron.right"
        case .chevronLeft: return "chevron.left"
        case .penLine: return "pencil.line"
        case .fileUp: return "arrow.up.doc"
        case .fileText: return "doc.text"
        case .layers: return "square.3.layers.3d"
        case .search: return "magnifyingglass"
        case .settings: return "gearshape"
        case .logOut: return "rectangle.portrait.and.arrow.right"
        case .layoutDashboard: return "square.grid.2x2"
        case .library: return "books.vertical"
        case .disc3: return "opticaldiscdrive"
        case .check: return "checkmark"
        case .copy: return "doc.on.doc"
        case .save: return "square.and.arrow.down"
        case .trash: return "trash"
        case .pencil: return "pencil"
        case .download: return "arrow.down.circle"
        case .focus: return "viewfinder"
        case .type: return "textformat.size"
        case .unfoldVertical: return "arrow.up.and.down"
        case .unfoldHorizontal: return "arrow.left.and.right"
        case .alertTriangle: return "exclamationmark.triangle"
        case .info: return "info.circle"
        case .clock: return "clock"
        case .play: return "play.fill"
        case .pause: return "pause.fill"
        case .stop: return "stop.fill"
        case .skipBack: return "backward.end.fill"
        case .skipForward: return "forward.end.fill"
        case .heart: return "heart"
        case .mail: return "envelope"
        case .user: return "person"
        }
    }
}

struct Icon: View {
    let name: IconName
    var size: CGFloat = 20
    var color: Color = Theme.fg2
    var filled: Bool = false

    var body: some View {
        Image(systemName: filled && name == .heart ? "heart.fill" : name.symbolName)
            .font(.system(size: size, weight: .regular))
            .foregroundStyle(color)
    }
}
