import { useLightSensor } from "@/hooks/use-light";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Lux thresholds that define game zones ---
// The player must keep illuminance inside the TARGET band.
// Cover/uncover the camera flash to control brightness.
const LUX_MAX = 1000;     // lux cap for visual meter
const GAME_DURATION = 30; // seconds per round

// --- Papaya orange dark palette ---
const ACCENT = "#FF6B2B";
const CARD_BG = "#1C1410";
const SURFACE = "#120D09";
const TARGET_COLOR = "#FFB347";
const SAFE_COLOR = "#4ADE80";   // zone colour when inside target
const DANGER_COLOR = "#FF3D00"; // colour when outside target

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
    easy:   { label: "EASY",      zoneLow: 0,   zoneHigh: 600, tickMs: 400, color: "#FFCBA4" },
    normal: { label: "NORMAL",    zoneLow: 50,  zoneHigh: 200, tickMs: 200, color: ACCENT },
    hard:   { label: "HARD",      zoneLow: 80,  zoneHigh: 130, tickMs: 150, color: "#FF8C42" },
    insane: { label: "😈 INSANE", zoneLow: 95,  zoneHigh: 115, tickMs: 100, color: "#FF3D00" },
};

/** Clamp v between min and max (inclusive). */
function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

/** Convert a lux value to a 0-1 fraction of the display meter. */
function luxToFraction(lux: number) {
    return clamp(lux / LUX_MAX, 0, 1);
}

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
    const timerColor = timeLeft <= 10 ? DANGER_COLOR : timeLeft <= 20 ? "#FF8C42" : ACCENT;
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
        backgroundColor: "#100A06",
        paddingHorizontal: 20,
        gap: 12,
    },
    header: { alignItems: "center" },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 5,
    },
    subtitle: {
        fontSize: 11,
        color: "#5A3A20",
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
        borderColor: "#2E1A0A",
        alignItems: "center",
        backgroundColor: CARD_BG,
    },
    speedBtnText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#5A3A20",
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
        borderColor: "#2E1A0A",
    },
    timerBox: { flex: 1.5 },
    hudLabel: {
        fontSize: 9,
        fontWeight: "700",
        color: "#5A3A20",
        letterSpacing: 1.5,
    },
    hudNumber: {
        fontSize: 28,
        fontWeight: "800",
        color: "#FFFFFF",
        lineHeight: 34,
    },
    timerNumber: {
        fontSize: 34,
        fontWeight: "800",
        lineHeight: 40,
    },
    timerBarBg: {
        width: "90%",
        height: 3,
        backgroundColor: "#2E1A0A",
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
        borderColor: "#2E1A0A",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    // Overlay (idle / gameover)
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(16,8,4,0.90)",
        gap: 8,
        paddingHorizontal: 24,
    },
    overlayEmoji: { fontSize: 42 },
    overlayTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 4,
    },
    overlayHint: {
        fontSize: 13,
        color: "#6B3E1E",
        textAlign: "center",
        lineHeight: 20,
    },
    gameOverScore: {
        fontSize: 15,
        color: "#A0673A",
        fontWeight: "600",
    },
    newBest: {
        fontSize: 15,
        color: TARGET_COLOR,
        fontWeight: "700",
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
        color: "#FFFFFF",
        fontWeight: "800",
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
        backgroundColor: "#1C1410",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#2E1A0A",
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
        fontSize: 11,
        color: "#5A3A20",
    },
    meterBottomLabel: {
        position: "absolute",
        bottom: 0,
        fontSize: 11,
        color: "#5A3A20",
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
        fontSize: 12,
        color: TARGET_COLOR,
        fontWeight: "600",
    },

    // Status badge
    zoneBadge: {
        position: "absolute",
        bottom: 14,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: "rgba(16,8,4,0.7)",
        alignItems: "center",
    },
    zoneBadgeText: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
    },
    luxReading: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
        marginTop: 2,
    },

    // Sensor card
    sensorCard: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#2E1A0A",
    },
    sensorTitle: {
        fontSize: 9,
        fontWeight: "700",
        color: "#5A3A20",
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
        backgroundColor: "#2E1A0A",
    },
    sensorLabel: {
        fontSize: 9,
        fontWeight: "700",
        color: "#5A3A20",
        letterSpacing: 1,
        marginBottom: 4,
    },
    sensorValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    unavailable: {
        marginTop: 10,
        color: DANGER_COLOR,
        fontSize: 12,
        textAlign: "center",
    },
});
