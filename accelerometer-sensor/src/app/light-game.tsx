import { useLightSensor } from "@/hooks/use-light";
import { Category, Fonts, palette } from "@/constants/theme";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Lux thresholds that define game zones ---
// The player must keep illuminance inside the TARGET band.
// Cover/uncover the camera flash to control brightness.
const LUX_MAX = 1000;     // lux cap for visual meter
const GAME_DURATION = 30; // seconds per round

// --- Brand dark palette (ink-black / cream / coral) ---
const ACCENT = palette.tertiary;
const CARD_BG = palette.surface;
const SURFACE = palette.surfaceDim;
const TARGET_COLOR = Category.light;   // amber target zone
const SAFE_COLOR = "#7CD9A6";   // zone colour when inside target
const DANGER_COLOR = palette.error; // colour when outside target

type GameState = "idle" | "playing" | "gameover";
type DiffLevel = "easy" | "normal" | "hard" | "insane";

/**
 * DIFFICULTY_CONFIG
 * Each level tweaks two things:
 *   zoneLow / zoneHigh — the lux band the player must stay inside (narrower = harder)
 *   tickMs             — how often +1 is awarded while in-zone (lower = more score pressure)
 */
const DIFFICULTY_CONFIG: Record<DiffLevel, {
    label: string;
    zoneLow: number;
    zoneHigh: number;
    tickMs: number;
    color: string;
}> = {
    easy:   { label: "EASY",      zoneLow: 0,   zoneHigh: 600, tickMs: 400, color: "#7CD9A6" },
    normal: { label: "NORMAL",    zoneLow: 50,  zoneHigh: 200, tickMs: 200, color: ACCENT },
    hard:   { label: "HARD",      zoneLow: 80,  zoneHigh: 130, tickMs: 150, color: Category.light },
    insane: { label: "😈 INSANE", zoneLow: 95,  zoneHigh: 115, tickMs: 100, color: palette.error },
};

/** Clamp v between min and max (inclusive). */
function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

/** Convert a lux value to a 0-1 fraction of the display meter. */
function luxToFraction(lux: number) {
    return clamp(lux / LUX_MAX, 0, 1);
}

/**
 * LightGame
 *
 * Core concept: the ambient light sensor reports illuminance in lux — a measure of
 * how much visible light is hitting the device's sensor (usually near the front camera).
 * This component challenges the player to keep the live lux reading inside a target band
 * by physically covering or exposing the sensor (e.g. with a finger or by moving toward
 * a light source).
 *
 * Scoring mechanism (setTimeout-based, not setInterval):
 *   - A recursive `tick` function re-schedules itself at `tickMs` intervals.
 *   - On each tick it checks whether the current illuminance is within [zoneLow, zoneHigh].
 *   - If yes, scoreRef is incremented and the new score is written to state.
 *   - Using setTimeout (rather than setInterval) means changing the difficulty selector
 *     mid-game takes effect on the very next tick without needing to tear down the loop.
 *
 * Difficulty narrows the lux band and speeds up the tick:
 *   EASY   — 0–600 lux  (almost any lighting)     400 ms/tick
 *   NORMAL — 50–200 lux (indoor ambient)           200 ms/tick
 *   HARD   — 80–130 lux (carefully shaded)         150 ms/tick
 *   INSANE — 95–115 lux (20-lux window, precise)   100 ms/tick
 *
 * The vertical lux meter maps 0–LUX_MAX to screen height, with the target zone
 * highlighted in orange and a glowing ball indicator tracking the live reading.
 */
export default function LightGame() {
    const insets = useSafeAreaInsets();
    const { available, illuminance } = useLightSensor();

    const [gameState, setGameState] = useState<GameState>("idle");
    const [difficulty, setDifficulty] = useState<DiffLevel>("normal");
    const diffRef = useRef<DiffLevel>("normal"); // ref so intervals read latest without re-mounting
    const [score, setScore] = useState(0);        // total ticks inside the target zone
    const [highScore, setHighScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [inZone, setInZone] = useState(false);  // whether illuminance is inside the target band

    // Refs used by the score interval to avoid stale closure values
    const illuminanceRef = useRef(0);
    const scoreRef = useRef(0);

    // Keep diffRef in sync so intervals always use latest selection
    useEffect(() => { diffRef.current = difficulty; }, [difficulty]);

    // Keep illuminanceRef in sync with the latest sensor reading
    useEffect(() => { illuminanceRef.current = illuminance; }, [illuminance]);

    // Update inZone every time illuminance or difficulty changes
    useEffect(() => {
        const { zoneLow, zoneHigh } = DIFFICULTY_CONFIG[difficulty];
        setInZone(illuminance >= zoneLow && illuminance <= zoneHigh);
    }, [illuminance, difficulty]);

    // Score ticker: award +1 at the difficulty's tick rate while in-zone
    useEffect(() => {
        if (gameState !== "playing") return;

        const tick = () => {
            const { zoneLow, zoneHigh, tickMs } = DIFFICULTY_CONFIG[diffRef.current];
            if (illuminanceRef.current >= zoneLow && illuminanceRef.current <= zoneHigh) {
                scoreRef.current += 1;
                setScore(scoreRef.current);
            }
            // Reschedule at current tickMs so difficulty changes apply immediately
            timerId = setTimeout(tick, tickMs);
        };
        let timerId = setTimeout(tick, DIFFICULTY_CONFIG[diffRef.current].tickMs);

        return () => clearTimeout(timerId);
    }, [gameState]);

    // Countdown timer — ticks every 1s; ends game when it hits 0
    useEffect(() => {
        if (gameState !== "playing") return;

        const id = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameState("gameover");
                    setHighScore(h => Math.max(h, scoreRef.current));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(id);
    }, [gameState]);

    // Reset all state and start a fresh round
    const startGame = useCallback(() => {
        scoreRef.current = 0;
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setGameState("playing");
    }, []);

    // Derived display values
    const timerPct = timeLeft / GAME_DURATION;
    const timerColor = timeLeft <= 10 ? DANGER_COLOR : timeLeft <= 20 ? Category.light : ACCENT;
    const isNewBest = gameState === "gameover" && score > 0 && score >= highScore;
    const luxFraction = luxToFraction(illuminance);
    const { zoneLow, zoneHigh } = DIFFICULTY_CONFIG[difficulty];
    const targetLowFraction = luxToFraction(zoneLow);
    const targetHighFraction = luxToFraction(zoneHigh);
    const activeColor = inZone ? SAFE_COLOR : DANGER_COLOR;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>LIGHT CONTROL</Text>
                <Text style={styles.subtitle}>Keep illuminance in the orange zone</Text>
            </View>

            {/* Difficulty Selector */}
            <View style={styles.speedRow}>
                {(Object.keys(DIFFICULTY_CONFIG) as DiffLevel[]).map(level => {
                    const cfg = DIFFICULTY_CONFIG[level];
                    const active = difficulty === level;
                    return (
                        <TouchableOpacity
                            key={level}
                            onPress={() => setDifficulty(level)}
                            activeOpacity={0.75}
                            style={[styles.speedBtn, active && { backgroundColor: cfg.color + "22", borderColor: cfg.color }]}
                        >
                            <Text style={[styles.speedBtnText, active && { color: cfg.color }]}>{cfg.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* HUD */}
            <View style={styles.hud}>
                <View style={styles.hudBox}>
                    <Text style={styles.hudLabel}>SCORE</Text>
                    <Text style={styles.hudNumber}>{score}</Text>
                </View>
                <View style={[styles.hudBox, styles.timerBox]}>
                    <Text style={[styles.timerNumber, { color: timerColor }]}>{timeLeft}</Text>
                    <Text style={[styles.hudLabel, { color: timerColor }]}>SEC</Text>
                    <View style={styles.timerBarBg}>
                        <View style={[styles.timerBarFill, { width: `${timerPct * 100}%`, backgroundColor: timerColor }]} />
                    </View>
                </View>
                <View style={styles.hudBox}>
                    <Text style={styles.hudLabel}>BEST</Text>
                    <Text style={styles.hudNumber}>{highScore}</Text>
                </View>
            </View>

            {/* Main Arena — vertical lux meter */}
            <View style={styles.arena}>
                {(gameState === "idle" || gameState === "gameover") && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayEmoji}>{gameState === "idle" ? "💡" : "⏱️"}</Text>
                        <Text style={styles.overlayTitle}>{gameState === "idle" ? "LIGHT CONTROL" : "TIME'S UP!"}</Text>
                        {gameState === "idle" ? (
                            <Text style={styles.overlayHint}>
                                Cover or expose your device's{"\n"}light sensor to control brightness.{"\n"}Stay inside the glowing zone!
                            </Text>
                        ) : (
                            <>
                                <Text style={styles.gameOverScore}>You scored {score} points!</Text>
                                {isNewBest && <Text style={styles.newBest}>🏆 New High Score!</Text>}
                            </>
                        )}
                        <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
                            <Text style={styles.startBtnText}>{gameState === "idle" ? "START GAME" : "PLAY AGAIN"}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {gameState === "playing" && (
                    <View style={styles.meterContainer}>
                        {/* Lux meter track */}
                        <View style={styles.meterTrack}>
                            {/* Target zone highlight */}
                            <View style={[styles.targetZone, {
                                bottom: `${targetLowFraction * 100}%`,
                                height: `${(targetHighFraction - targetLowFraction) * 100}%`,
                            }]} />

                            {/* Current lux fill bar */}
                            <View style={[styles.luxFill, {
                                height: `${luxFraction * 100}%`,
                                backgroundColor: activeColor,
                                shadowColor: activeColor,
                            }]} />

                            {/* Lux indicator dot */}
                            <View style={[styles.luxDot, {
                                bottom: `${luxFraction * 100}%`,
                                backgroundColor: activeColor,
                                shadowColor: activeColor,
                            }]} />

                            {/* Target zone boundary lines */}
                            <View style={[styles.zoneLine, { bottom: `${targetLowFraction * 100}%` }]} />
                            <View style={[styles.zoneLine, { bottom: `${targetHighFraction * 100}%` }]} />
                        </View>

                        {/* Labels beside the meter */}
                        <View style={styles.meterLabels}>
                            <Text style={styles.meterTopLabel}>☀️ {LUX_MAX}</Text>
                            <View style={[styles.zoneLabelHigh, { bottom: `${targetHighFraction * 100}%` }]}>
                                <Text style={styles.zoneLabel}>{zoneHigh} lx</Text>
                            </View>
                            <View style={[styles.zoneLabelLow, { bottom: `${targetLowFraction * 100}%` }]}>
                                <Text style={styles.zoneLabel}>{zoneLow} lx</Text>
                            </View>
                            <Text style={styles.meterBottomLabel}>🌑 0</Text>
                        </View>
                    </View>
                )}

                {/* In-zone status badge */}
                {gameState === "playing" && (
                    <View style={[styles.zoneBadge, { borderColor: activeColor }]}>
                        <Text style={[styles.zoneBadgeText, { color: activeColor }]}>
                            {inZone ? "✓ IN ZONE" : "OUT OF ZONE"}
                        </Text>
                        <Text style={styles.luxReading}>{Math.round(illuminance)} lux</Text>
                    </View>
                )}
            </View>

            {/* Sensor card */}
            <View style={styles.sensorCard}>
                <Text style={styles.sensorTitle}>LIGHT SENSOR</Text>
                <View style={styles.sensorRow}>
                    <View style={styles.sensorItem}>
                        <Text style={styles.sensorLabel}>ILLUMINANCE</Text>
                        <Text style={styles.sensorValue}>{Math.round(illuminance)} lux</Text>
                    </View>
                    <View style={styles.sensorDivider} />
                    <View style={styles.sensorItem}>
                        <Text style={styles.sensorLabel}>TARGET ZONE</Text>
                        <Text style={[styles.sensorValue, { color: TARGET_COLOR }]}>
                            {zoneLow}–{zoneHigh} lux
                        </Text>
                    </View>
                    <View style={styles.sensorDivider} />
                    <View style={styles.sensorItem}>
                        <Text style={styles.sensorLabel}>STATUS</Text>
                        <Text style={[styles.sensorValue, { color: inZone ? SAFE_COLOR : DANGER_COLOR }]}>
                            {available === null ? "..." : available === false ? "N/A" : inZone ? "IN" : "OUT"}
                        </Text>
                    </View>
                </View>
                {available === false && (
                    <Text style={styles.unavailable}>
                        Light sensor unavailable — Android only
                    </Text>
                )}
            </View>
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

    // Difficulty selector
    speedRow: {
        flexDirection: "row",
        gap: 8,
    },
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
    timerBarBg: {
        width: "90%",
        height: 3,
        backgroundColor: palette.outline,
        borderRadius: 2,
        marginTop: 4,
        overflow: "hidden",
    },
    timerBarFill: {
        height: "100%",
        borderRadius: 2,
    },

    // Arena
    arena: {
        flex: 1,
        backgroundColor: SURFACE,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.outline,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    // Overlay (idle / gameover)
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(10,11,14,0.92)",
        gap: 8,
        paddingHorizontal: 24,
    },
    overlayEmoji: { fontSize: 42 },
    overlayTitle: {
        fontFamily: Fonts.headlineBold,
        fontSize: 22,
        color: palette.onSurface,
        letterSpacing: 4,
    },
    overlayHint: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: palette.onSurfaceVariant,
        textAlign: "center",
        lineHeight: 20,
    },
    gameOverScore: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 15,
        color: palette.onSurfaceVariant,
    },
    newBest: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: TARGET_COLOR,
    },
    startBtn: {
        marginTop: 10,
        backgroundColor: ACCENT,
        paddingHorizontal: 36,
        paddingVertical: 13,
        borderRadius: 50,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 14,
        elevation: 8,
    },
    startBtnText: {
        fontFamily: Fonts.bodyBold,
        color: "#FFFFFF",
        fontSize: 14,
        letterSpacing: 2,
    },

    // Lux meter
    meterContainer: {
        flexDirection: "row",
        flex: 1,
        alignItems: "stretch",
        paddingVertical: 20,
        paddingHorizontal: 20,
        gap: 10,
    },
    meterTrack: {
        width: 40,
        backgroundColor: palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.outline,
        overflow: "visible",
        position: "relative",
        justifyContent: "flex-end",
    },
    targetZone: {
        position: "absolute",
        left: 0,
        right: 0,
        backgroundColor: `${TARGET_COLOR}25`,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },
    luxFill: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 4,
    },
    luxDot: {
        position: "absolute",
        left: -6,
        width: 52,
        height: 14,
        borderRadius: 7,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: -7,
    },
    zoneLine: {
        position: "absolute",
        left: -4,
        right: -4,
        height: 2,
        backgroundColor: TARGET_COLOR,
        opacity: 0.7,
    },
    meterLabels: {
        flex: 1,
        position: "relative",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    meterTopLabel: {
        position: "absolute",
        top: 0,
        fontFamily: Fonts.body,
        fontSize: 11,
        color: palette.onSurfaceVariant,
    },
    meterBottomLabel: {
        position: "absolute",
        bottom: 0,
        fontFamily: Fonts.body,
        fontSize: 11,
        color: palette.onSurfaceVariant,
    },
    zoneLabelHigh: {
        position: "absolute",
        left: 0,
    },
    zoneLabelLow: {
        position: "absolute",
        left: 0,
    },
    zoneLabel: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 12,
        color: TARGET_COLOR,
    },

    // Status badge
    zoneBadge: {
        position: "absolute",
        bottom: 14,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: "rgba(10,11,14,0.72)",
        alignItems: "center",
    },
    zoneBadgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        letterSpacing: 1.5,
    },
    luxReading: {
        fontFamily: Fonts.headlineBold,
        fontSize: 18,
        color: palette.onSurface,
        marginTop: 2,
    },

    // Sensor card
    sensorCard: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: palette.outline,
    },
    sensorTitle: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 9,
        color: palette.onSurfaceVariant,
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    sensorRow: { flexDirection: "row" },
    sensorItem: {
        flex: 1,
        alignItems: "center",
    },
    sensorDivider: {
        width: 1,
        backgroundColor: palette.outline,
    },
    sensorLabel: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 9,
        color: palette.onSurfaceVariant,
        letterSpacing: 1,
        marginBottom: 4,
    },
    sensorValue: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: palette.onSurface,
    },
    unavailable: {
        fontFamily: Fonts.body,
        marginTop: 10,
        color: DANGER_COLOR,
        fontSize: 12,
        textAlign: "center",
    },
});
