//
//  MiniPlayerView.swift
//  listen — persistent bar above the tab bar while a document has audio
//  loaded. Not an explicitly named screen in the README, but "140px bottom
//  padding to clear the player" on Dashboard implies a docked mini-player;
//  built here to match that behaviour.
//

import SwiftUI

struct MiniPlayerView: View {
    @Environment(PlayerStore.self) private var player
    var onOpen: () -> Void

    var body: some View {
        if player.hasAudio {
            Button(action: onOpen) {
                VStack(spacing: Theme.Space.xs) {
                    ProgressBarView(value: player.timing.progress(player.elapsed) * 100, height: 2)
                    HStack {
                        Text(player.currentDocTitle ?? "")
                            .font(.inter(13, weight: .medium))
                            .foregroundStyle(Theme.fg1)
                            .lineLimit(1)
                        Spacer()
                        Button {
                            player.playing ? player.pause() : player.play()
                        } label: {
                            Icon(name: player.playing ? .pause : .play, size: 14, color: .white)
                                .frame(width: 28, height: 28)
                                .background(Theme.accent)
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(Theme.Space.sm)
                .background(Theme.bgRaised)
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).stroke(Theme.lineQuiet, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
                .padding(.horizontal, 12)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Open reader, \(player.currentDocTitle ?? "")")
        }
    }
}
