import { useShake } from "@/hooks/use-shake";
import { Category, Fonts, palette } from "@/constants/theme";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Brand dark palette (ink-black / cream / coral) ──────────────────────
const ACCENT       = palette.tertiary; // coral
const CARD_BG      = palette.surface;
const SURFACE      = palette.surfaceDim;
const TARGET_COLOR = Category.light;   // amber accent (best streak)

/**
 * ShakeDetector
 *
 * Core concept:
 *   This screen wraps the `useShake` hook, which sits on top of DeviceMotion's
 *   gravity-compensated `acceleration` field. A resting phone has near-zero
 *   magnitude; a sharp shake bursts well above the threshold in a short window.
 *
 *   UI feedback:
 *   - A glowing orb pulses (Animated.spring) on every detected shake.
 *   - A live "recent shakes" log shows the last 8 shake timestamps.
 *   - The session shake count and best streak per session are tracked.
 *   - Sensitivity can be toggled between three presets: LOW / MEDIUM / HIGH.
 *
 *   Sensitivity presets change `threshold` passed to `useShake`:
 *     LOW    — needs a firm deliberate shake  (threshold 2.2 g)
 *     MEDIUM — balanced default               (threshold 1.8 g)
 *     HIGH   — detects even light taps        (threshold 1.2 g)
 */

type Sensitivity = "low" | "medium" | "high";

const SENSITIVITY_CONFIG: Record<Sensitivity, { label: string; threshold: number; color: string }> = {
    low:    { label: "LOW",    threshold: 2.2, color: "#7CD9A6" },
    medium: { label: "MEDIUM", threshold: 1.8, color: ACCENT },
    high:   { label: "HIGH",   threshold: 1.2, color: palette.error },
};

/** Format a Date to HH:MM:SS.mmm */
function formatTime(d: Date): string {
    const pad  = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export default function ShakeDetector() {
    const insets = useSafeAreaInsets();

    const [sensitivity, setSensitivity] = useState<Sensitivity>("medium");
    const [log, setLog]                 = useState<string[]>([]);  // recent shake timestamps (newest first)
    const [streak, setStreak]           = useState(0);             // shakes in the last 5 s
    const [bestStreak, setBestStreak]   = useState(0);

    const streakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streakRef      = useRef(0);

    // Animated value for the orb pulse effect
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim  = useRef(new Animated.Value(0)).current;

    const { threshold } = SENSITIVITY_CONFIG[sensitivity];

    // ── Shake handler ───────────────────────────────────────────────────────
    const handleShake = () => {
        const now = new Date();

        // Append to log (keep newest 8)
        setLog(prev => [`${formatTime(now)}`, ...prev].slice(0, 8));

        // Streak: each shake extends/resets a 5-second window
        if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
        streakRef.current += 1;
        setStreak(streakRef.current);
        setBestStreak(b => Math.max(b, streakRef.current));

        streakTimerRef.current = setTimeout(() => {
            streakRef.current = 0;
            setStreak(0);
        }, 5000);

        // Orb pulse: spring out then settle back
        pulseAnim.setValue(1);
        glowAnim.setValue(1);
        Animated.parallel([
            Animated.spring(pulseAnim, {
                toValue: 1.5,
                friction: 3,
                tension: 120,
                useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start(() => {
            Animated.spring(pulseAnim, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }).start();
        });
    };

    const { shakeCount, available } = useShake({ threshold, onShake: handleShake });

    // Cleanup streak timer on unmount
    useEffect(() => () => {
        if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
    }, []);

    const clearLog = () => {
        setLog([]);
        streakRef.current = 0;
        setStreak(0);
    };

    const orbBg = glowAnim.interpolate({
        inputRange:  [0, 1],
        outputRange: [SURFACE, ACCENT + "AA"],
    });
    const orbBorder = glowAnim.interpolate({
        inputRange:  [0, 1],
        outputRange: [palette.outline, ACCENT],
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>SHAKE DETECTOR</Text>
                <Text style={styles.subtitle}>Shake your device to trigger events</Text>
            </View>

            {/* Sensitivity Selector */}
            <View style={styles.speedRow}>
                {(Object.keys(SENSITIVITY_CONFIG) as Sensitivity[]).map(level => {
                    const cfg    = SENSITIVITY_CONFIG[level];
                    const active = sensitivity === level;
                    return (
                        <TouchableOpacity
                            key={level}
                            onPress={() => setSensitivity(level)}
                            activeOpacity={0.75}
                            style={[styles.speedBtn, active && { backgroundColor: cfg.color + "22", borderColor: cfg.color }]}
                        >
                            <Text style={[styles.speedBtnText, active && { color: cfg.color }]}>{cfg.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* HUD — total / streak / best streak */}
            <View style={styles.hud}>
                <View style={styles.hudBox}>
                    <Text style={styles.hudLabel}>TOTAL</Text>
                    <Text style={styles.hudNumber}>{shakeCount}</Text>
                </View>
                <View style={[styles.hudBox, styles.timerBox, streak > 0 && { borderColor: ACCENT }]}>
                    <Text style={[styles.timerNumber, { color: streak > 0 ? ACCENT : palette.onSurface }]}>
                        {streak}
                    </Text>
                    <Text style={[styles.hudLabel, { color: streak > 0 ? ACCENT : palette.onSurfaceVariant }]}>
                        STREAK
                    </Text>
                    <Text style={styles.streakHint}>resets after 5 s</Text>
                </View>
                <View style={styles.hudBox}>
                    <Text style={styles.hudLabel}>BEST</Text>
                    <Text style={[styles.hudNumber, { color: TARGET_COLOR }]}>{bestStreak}</Text>
                </View>
            </View>

            {/* Orb — visual feedback centre */}
            <View style={styles.orbSection}>
                <Animated.View
                    style={[
                        styles.orb,
                        {
                            transform: [{ scale: pulseAnim }],
                            backgroundColor: orbBg,
                            borderColor: orbBorder,
                        },
                    ]}
                >
                    <Text style={styles.orbEmoji}>{shakeCount === 0 ? "📱" : "💥"}</Text>
                    <Text style={styles.orbLabel}>
                        {shakeCount === 0 ? "Waiting for shake…" : `Shake #${shakeCount}`}
                    </Text>
                </Animated.View>
            </View>

            {/* Recent shake log */}
            <View style={styles.logCard}>
                <View style={styles.logHeader}>
                    <Text style={styles.sensorTitle}>RECENT SHAKES</Text>
                    {log.length > 0 && (
                        <TouchableOpacity onPress={clearLog} activeOpacity={0.7}>
                            <Text style={styles.clearBtn}>CLEAR</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {log.length === 0 ? (
                    <Text style={styles.logEmpty}>No shakes recorded yet</Text>
                ) : (
                    log.map((entry, i) => (
                        <View key={i} style={styles.logRow}>
                            <Text style={styles.logIndex}>#{shakeCount - i}</Text>
                            <Text style={[styles.logTime, i === 0 && { color: ACCENT }]}>{entry}</Text>
                            {i === 0 && <Text style={styles.logLatest}>latest</Text>}
                        </View>
                    ))
                )}
            </View>

            {/* Sensor availability notice */}
            {available === false && (
                <Text style={styles.unavailable}>DeviceMotion unavailable on this device</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
        paddingHorizontal: 20,
        gap: 12,
    },
    header: { alignItems: "center" },
    title: {
        fontFamily: Fonts.headlineBold,
        fontSize: 26,
        color: palette.onSurface,
        letterSpacing: 5,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 11,
        color: palette.onSurfaceVariant,
        letterSpacing: 1,
        marginTop: 2,
    },

    // Sensitivity selector (reuses speed-selector styles for consistency)
    speedRow: { flexDirection: "row", gap: 8 },
    speedBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.outline,
        alignItems: "center",
        backgroundColor: CARD_BG,
    },
    speedBtnText: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 10,
        color: palette.onSurfaceVariant,
        letterSpacing: 0.8,
    },

    // HUD
    hud: { flexDirection: "row", gap: 10 },
    hudBox: {
        flex: 1,
        backgroundColor: CARD_BG,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: palette.outline,
    },
    timerBox: { flex: 1.5 },
    hudLabel: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 9,
        color: palette.onSurfaceVariant,
        letterSpacing: 1.5,
    },
    hudNumber: {
        fontFamily: Fonts.headlineBold,
        fontSize: 28,
        color: palette.onSurface,
        lineHeight: 34,
    },
    timerNumber: {
        fontFamily: Fonts.headlineBold,
        fontSize: 34,
        lineHeight: 40,
    },
    streakHint: {
        fontFamily: Fonts.body,
        fontSize: 8,
        color: palette.onSurfaceVariant,
        marginTop: 2,
        letterSpacing: 0.5,
    },

    // Orb
    orbSection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    orb: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 8,
    },
    orbEmoji: { fontSize: 40 },
    orbLabel: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 11,
        color: palette.onSurfaceVariant,
        letterSpacing: 0.8,
        textAlign: "center",
        paddingHorizontal: 12,
    },

    // Log card
    logCard: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: palette.outline,
        gap: 6,
    },
    logHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    sensorTitle: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 9,
        color: palette.onSurfaceVariant,
        letterSpacing: 1.5,
    },
    clearBtn: {
        fontFamily: Fonts.bodyBold,
        fontSize: 9,
        color: ACCENT,
        letterSpacing: 1,
    },
    logEmpty: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: palette.onSurfaceVariant,
        textAlign: "center",
        paddingVertical: 8,
    },
    logRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 3,
        borderBottomWidth: 1,
        borderBottomColor: palette.outlineVariant,
    },
    logIndex: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: palette.onSurfaceVariant,
        width: 32,
    },
    logTime: {
        flex: 1,
        fontFamily: Fonts.bodySemibold,
        fontSize: 12,
        color: palette.onSurfaceVariant,
        fontVariant: ["tabular-nums"],
    },
    logLatest: {
        fontFamily: Fonts.bodyBold,
        fontSize: 9,
        color: ACCENT,
        letterSpacing: 0.8,
    },

    unavailable: {
        fontFamily: Fonts.body,
        color: palette.error,
        fontSize: 12,
        textAlign: "center",
    },
});
