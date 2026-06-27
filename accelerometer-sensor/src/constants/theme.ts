/**
 * theme.ts
 * --------
 * Central design tokens for Sensify, translated from the brand guidelines into
 * React Native values.
 *
 * - Colors: full light + dark palettes (the app currently renders in dark mode).
 * - Fonts:  Inter (body / UI) + Space Grotesk (headlines / display), loaded in
 *           app/_layout.tsx via @expo-google-fonts.
 * - Category: per-sensor identity colors used to color-code each game.
 * - Typography: ready-made text style presets matching the spec.
 *
 * Web letter-spacing values (in `em`) are converted to absolute px in RN using
 * `em * fontSize`.
 */

export const Colors = {
    light: {
        background: "#F7F6F2",
        surface: "#F7F6F2",
        surfaceElevated: "#FFFFFF",
        primary: "#0F1115", // ink-black CTA
        onPrimary: "#FFFFFF",
        secondary: "#4A4F58",
        tertiary: "#E94B35", // coral accent
        onTertiary: "#FFFFFF",
        onSurface: "#0F1115",
        onSurfaceVariant: "#5A5F68",
        outline: "#B8B2A4",
        outlineVariant: "#E5E0D6",
        error: "#DC2626",
        peach: "#FFEBCC",
        cream: "#FFF9D2",
    },
    dark: {
        background: "#0A0B0E",
        surface: "#14161B", // slightly elevated card surface
        surfaceElevated: "#1B1E25",
        surfaceDim: "#0E0F13", // recessed (arena / wells)
        primary: "#F2EFE7", // cream
        onPrimary: "#0F1115",
        secondary: "#9CA3AF",
        tertiary: "#FF6B52", // brighter coral accent
        onTertiary: "#0F1115",
        onSurface: "#F2EFE7",
        onSurfaceVariant: "#9CA3AF",
        outline: "#2A2E37",
        outlineVariant: "#22252C",
        error: "#FF6B6B",
        peach: "#FFEBCC",
        cream: "#FFF9D2",
    },
} as const;

/** Active palette — the app is dark-mode by design. */
export const palette = Colors.dark;

/**
 * Per-sensor identity colors. The coral tertiary is the primary brand accent;
 * each game keeps a distinct hue so the home menu stays color-coded.
 */
export const Category = {
    accelerometer: "#FF6B52", // coral (primary)
    gyroscope: "#FFB37A", // warm sand
    light: "#FFD479", // amber
    magnetometer: "#B4A0FF", // violet
    motion: "#6FD0FF", // cyan
} as const;

/**
 * Font families. Keys mirror the loaded @expo-google-fonts module exports.
 * Inter = body/UI, Space Grotesk = headlines/display.
 */
export const Fonts = {
    body: "Inter_400Regular",
    bodyMedium: "Inter_500Medium",
    bodySemibold: "Inter_600SemiBold",
    bodyBold: "Inter_700Bold",
    headline: "SpaceGrotesk_400Regular",
    headlineMedium: "SpaceGrotesk_500Medium",
    headlineSemibold: "SpaceGrotesk_600SemiBold",
    headlineBold: "SpaceGrotesk_700Bold",
    mono: "ui-monospace",
} as const;

/** Map of @expo-google-fonts exports → useFonts() in _layout.tsx. */
export type FontMap = Record<string, number>;

/**
 * Typography presets matching the spec.
 * letterSpacing is in px (RN); converted from the guideline's em values.
 */
export const Typography = {
    // Page title: ~1.875rem, Space Grotesk semibold, -0.02em
    title: {
        fontFamily: Fonts.headlineSemibold,
        fontSize: 30,
        letterSpacing: -0.6, // -0.02em * 30
    },
    // Headlines: Space Grotesk, -0.01em..-0.015em
    headline: {
        fontFamily: Fonts.headlineSemibold,
        letterSpacing: -0.3,
    },
    // Body default: 14px, line-height 1.6
    body: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 22, // ~1.6
    },
    // Section label: 11px, semibold, uppercase, tracking 0.18em
    sectionLabel: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 11,
        letterSpacing: 2, // 0.18em * 11 ≈ 2
        textTransform: "uppercase" as const,
    },
    // Badge: 10px, semibold, uppercase, wider tracking
    badge: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 10,
        letterSpacing: 1, // ~0.1em * 10
        textTransform: "uppercase" as const,
    },
    // Buttons: text-sm semibold, -0.005em
    button: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 14,
        letterSpacing: -0.07,
    },
} as const;
