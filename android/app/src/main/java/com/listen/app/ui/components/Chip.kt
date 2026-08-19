package com.listen.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme

@Composable
fun Chip(label: String, selected: Boolean, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    Text(
        label,
        color = if (selected) Theme.fg1 else Theme.fg2,
        fontFamily = ListenFonts.inter,
        fontSize = 13.sp,
        modifier = Modifier
            .background(if (selected) Theme.accentWash else androidx.compose.ui.graphics.Color.Transparent, RoundedCornerShape(Theme.Radius.pill))
            .border(1.dp, if (selected) Theme.accent else Theme.lineQuiet, RoundedCornerShape(Theme.Radius.pill))
            .clickable(interactionSource = interactionSource, indication = null) { onClick() }
            .padding(horizontal = 14.dp, vertical = 8.dp),
    )
}
