package com.listen.app.designsystem

/**
 * listen — maps the Lucide icon names used in the design spec to Material
 * Icons (port of ios/Listen/DesignSystem/Icon.swift, which does the same
 * mapping to SF Symbols).
 */

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Icon as Material3Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class IconName {
    AudioLines, Menu, Plus, X,
    ChevronRight, ChevronLeft,
    PenLine, FileUp, FileText, Layers, Search, Settings, LogOut,
    LayoutDashboard, Library, Disc3, Check, Copy, Save, Trash, Pencil,
    Download, Focus, Type, UnfoldVertical, UnfoldHorizontal,
    AlertTriangle, Info, ClockIcon, Play, Pause, Stop, SkipBack, SkipForward,
    Heart, Mail, User, Eye, EyeOff,
}

private fun vectorFor(name: IconName, filled: Boolean): ImageVector = when (name) {
    IconName.AudioLines -> Icons.Default.GraphicEq
    IconName.Menu -> Icons.Default.Menu
    IconName.Plus -> Icons.Default.Add
    IconName.X -> Icons.Default.Close
    IconName.ChevronRight -> Icons.Default.ChevronRight
    IconName.ChevronLeft -> Icons.Default.ChevronLeft
    IconName.PenLine -> Icons.Default.Edit
    IconName.FileUp -> Icons.Default.UploadFile
    IconName.FileText -> Icons.Default.Description
    IconName.Layers -> Icons.Default.Layers
    IconName.Search -> Icons.Default.Search
    IconName.Settings -> Icons.Default.Settings
    IconName.LogOut -> Icons.Default.Logout
    IconName.LayoutDashboard -> Icons.Default.GridView
    IconName.Library -> Icons.Default.LibraryBooks
    IconName.Disc3 -> Icons.Default.Album
    IconName.Check -> Icons.Default.Check
    IconName.Copy -> Icons.Default.ContentCopy
    IconName.Save -> Icons.Default.Save
    IconName.Trash -> Icons.Default.Delete
    IconName.Pencil -> Icons.Default.Edit
    IconName.Download -> Icons.Default.Download
    IconName.Focus -> Icons.Default.CenterFocusStrong
    IconName.Type -> Icons.Default.FormatSize
    IconName.UnfoldVertical -> Icons.Default.UnfoldMore
    IconName.UnfoldHorizontal -> Icons.Default.SwapHoriz
    IconName.AlertTriangle -> Icons.Default.WarningAmber
    IconName.Info -> Icons.Default.Info
    IconName.ClockIcon -> Icons.Default.Schedule
    IconName.Play -> Icons.Default.PlayArrow
    IconName.Pause -> Icons.Default.Pause
    IconName.Stop -> Icons.Default.Stop
    IconName.SkipBack -> Icons.Default.SkipPrevious
    IconName.SkipForward -> Icons.Default.SkipNext
    IconName.Heart -> if (filled) Icons.Default.Favorite else Icons.Outlined.FavoriteBorder
    IconName.Mail -> Icons.Default.Email
    IconName.User -> Icons.Default.Person
    IconName.Eye -> Icons.Default.Visibility
    IconName.EyeOff -> Icons.Default.VisibilityOff
}

@Composable
fun AppIcon(
    name: IconName,
    size: Dp = 20.dp,
    color: Color = Theme.fg2,
    filled: Boolean = false,
    modifier: Modifier = Modifier,
) {
    Material3Icon(
        imageVector = vectorFor(name, filled),
        contentDescription = null,
        tint = color,
        modifier = modifier.size(size),
    )
}
