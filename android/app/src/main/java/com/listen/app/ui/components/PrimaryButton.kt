package com.listen.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.listen.app.designsystem.ListenFonts
import com.listen.app.designsystem.Theme

@Composable
fun PrimaryButton(
    label: String,
    modifier: Modifier = Modifier,
    disabled: Boolean = false,
    loading: Boolean = false,
    onClick: () -> Unit,
) {
    val isDisabled = disabled || loading
    val interactionSource = remember { MutableInteractionSource() }

    Row(
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 44.dp)
            .background(
                if (isDisabled) Theme.lineStrong.copy(alpha = 0.7f) else Theme.accent,
                RoundedCornerShape(Theme.Radius.input),
            )
            .clickable(enabled = !isDisabled, interactionSource = interactionSource, indication = null) { onClick() }
            .padding(vertical = 15.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(
                color = Theme.fg1,
                strokeWidth = 2.dp,
                modifier = Modifier.padding(end = Theme.Space.sm),
            )
        }
        Text(
            label,
            color = Color.White,
            fontFamily = ListenFonts.inter,
            fontWeight = FontWeight.SemiBold,
            fontSize = 15.sp,
        )
    }
}
