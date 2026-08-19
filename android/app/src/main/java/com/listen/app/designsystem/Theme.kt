package com.listen.app.designsystem

/**
 * listen — Cairn design tokens (port of lib/theme.js / ios/Listen/DesignSystem/Theme.swift)
 *
 * Dark-first. ONE accent: indigo. No gradients, no decorative shadows, no blur.
 * Depth comes from the background ladder: base -> elevated -> raised.
 */

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.R

object Theme {
    // MARK: Colour
    val bgBase = Color(0xFF0B0F19)
    val bgElevated = Color(0xFF111727)
    val bgRaised = Color(0xFF1A2235)

    val fg1 = Color(0xFFE8EAF0)
    val fg2 = Color(0xFF9BA3B4)
    val fg3 = Color(0xFF5C6478)

    val accent = Color(0xFF6366F1)
    val accentHover = Color(0xFF7C7FF2)
    val accentWash = Color(0x1A6366F1) // accent @ 10% opacity

    val success = Color(0xFF10B981)
    val caution = Color(0xFFF59E0B)
    val danger = Color(0xFFEF4444)

    val lineQuiet = Color(0xFF1F2638)
    val lineStrong = Color(0xFF2D3650)

    // MARK: Spacing — only these values, no intermediates.
    object Space {
        val xs = 4.dp
        val sm = 8.dp
        val md = 12.dp
        val base = 16.dp
        val lg = 24.dp
        val xl = 32.dp
        val xxl = 48.dp
        val xxxl = 64.dp
        val section = 96.dp
    }

    // MARK: Radius
    object Radius {
        val button = 6.dp
        val input = 8.dp
        val card = 12.dp
        val surface = 16.dp
        val pill = 999.dp
    }

    // MARK: Motion (durations in ms, matching the spec's motion table)
    object Motion {
        const val hover = 150
        const val tap = 200
        const val dialog = 300
        const val screen = 400
        const val showcase = 600
    }

    val hitSlopMin = 44.dp
}

// MARK: - Type scale (Inter Tight for display/headings, Inter for body, JetBrains Mono for numerals)

private val interFamily = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
)

private val interTightFamily = FontFamily(
    Font(R.font.inter_tight_medium, FontWeight.Medium),
    Font(R.font.inter_tight_semibold, FontWeight.SemiBold),
    Font(R.font.inter_tight_bold, FontWeight.Bold),
)

private val jetBrainsMonoFamily = FontFamily(
    Font(R.font.jetbrains_mono_regular, FontWeight.Normal),
    Font(R.font.jetbrains_mono_medium, FontWeight.Medium),
    Font(R.font.jetbrains_mono_semibold, FontWeight.SemiBold),
)

object ListenFonts {
    val inter = interFamily
    val interTight = interTightFamily
    val mono = jetBrainsMonoFamily
}
