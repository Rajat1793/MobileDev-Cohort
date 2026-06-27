import { useMagnetometer } from "@/hooks/use-megnometer";
import { Category, Fonts, palette } from "@/constants/theme";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Brand dark palette (ink-black / cream / coral) ──────────────────────
const ACCENT       = palette.tertiary; // coral needle
const CARD_BG      = palette.surface;
const SURFACE      = palette.surfaceDim;
const TARGET_COLOR = Category.light;   // amber target marker
const SAFE_COLOR   = "#7CD9A6";        // on-target green
const DANGER_COLOR = palette.error;

const GAME_DURATION = 30;   // seconds per round
const COMPASS_SIZE  = 260;  // diameter of the compass disc in px
const R             = COMPASS_SIZE / 2; // radius

type GameState = "idle" | "playing" | "gameover";
type DiffLevel  = "easy" | "normal" | "hard" | "insane";

/**
 * DIFFICULTY_CONFIG
 *   tolerance — ±degrees that count as "on target" (smaller = harder to aim)
 *   tickMs    — ms between +1 score ticks while on target (lower = faster scoring)
 */
const DIFFICULTY_CONFIG: Record<DiffLevel, {
    label: string;
    tolerance: number;
    tickMs: number;
    color: string;
}> = {
    easy:   { label: "EASY",      tolerance: 30, tickMs: 300, color: "#7CD9A6" },
    normal: { label: "NORMAL",    tolerance: 20, tickMs: 200, color: ACCENT },
    hard:   { label: "HARD",      tolerance: 10, tickMs: 150, color: Category.light },
    insane: { label: "😈 INSANE", tolerance: 5,  tickMs: 100, color: palette.error },
};

/** Normalize an angle to [0, 360). */
function normalize(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

/** Smallest signed angular difference in (-180, 180]. */
function angleDiff(a: number, b: number): number {
    const d = normalize(a - b);
    return d > 180 ? d - 360 : d;
}

/**
 * Derive a 0–360° compass heading from raw magnetometer x / y.
 * Assumes the device is held roughly flat (face-up).
 * 0° = magnetic north, 90° = east, 180° = south, 270° = west.
 */
function headingFromMag(x: number, y: number): number {
    return normalize(Math.atan2(x, y) * (180 / Math.PI));
}

/** Pick a random target heading 0–359°. */
function randomTarget(): number {
    return Math.floor(Math.random() * 360);
}

// Cardinal direction names indexed by 45° buckets
const CARDINAL = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
function toCardinal(deg: number): string {
    return CARDINAL[Math.round(normalize(deg) / 45) % 8];
}

/**
 * CompassGame
 *
 * Core concept: the magnetometer reports the ambient magnetic field strength (μT) along
 * the device's three axes. When the phone lies flat, the X and Y components describe the
 * horizontal projection of Earth's magnetic field, which points toward magnetic north.
 * `Math.atan2(x, y)` converts that vector into a compass bearing (0–360°).
 *
 * Gameplay loop:
 *   1. A random target heading (0–359°) is chosen at the start and every 6 seconds.
 *   2. The player rotates their phone (flat, face-up) to align the live heading with the target.
 *   3. A `tick` function fires at `tickMs` intervals; if the angular difference between the
 *      current heading and the target is within the difficulty's `tolerance`, +1 is awarded.
 *   4. A 30-second countdown ends the round.
 *
 * Heading math:
 *   - `normalize(deg)` wraps any angle to [0, 360).
 *   - `angleDiff(a, b)` returns the shortest signed difference in (-180, 180] — needed so
 *     that crossing the 0°/360° boundary (north) doesn't create false large deltas.
 *
 * Visual representation:
 *   - The compass disc rotates by −heading so cardinal labels stay geographically fixed.
 *   - The orange needle layer rotates by +heading so it always points toward the device's
 *     current facing direction relative to the disc.
 *   - The target is shown as a glowing dot at the exact bearing angle on the rim,
 *     turning green when the tolerance window is satisfied.
 */
export default function CompassGame() {
    const insets = useSafeAreaInsets();
    const { available, data } = useMagnetometer();

    // ── Game state ──────────────────────────────────────────────────────────
    const [gameState, setGameState]         = useState<GameState>("idle");
    const [difficulty, setDifficulty]       = useState<DiffLevel>("normal");
    const [score, setScore]                 = useState(0);
    const [highScore, setHighScore]         = useState(0);
    const [timeLeft, setTimeLeft]           = useState(GAME_DURATION);
    const [targetHeading, setTargetHeading] = useState(0);
    const [inZone, setInZone]               = useState(false);

    // ── Refs (avoid stale closures inside intervals) ──────────────────────
    const diffRef    = useRef<DiffLevel>("normal");
    const headingRef = useRef(0);
    const targetRef  = useRef(0);
    const scoreRef   = useRef(0);
    const stateRef   = useRef<GameState>("idle");

    useEffect(() => { diffRef.current  = difficulty; }, [difficulty]);
    useEffect(() => { stateRef.current = gameState;  }, [gameState]);

    // ── Live compass heading derived from magnetometer x/y ────────────────
    const heading = headingFromMag(data.x, data.y);
    headingRef.current = heading;

    // ── In-zone check whenever heading or difficulty changes ──────────────
    useEffect(() => {
        if (gameState !== "playing") return;
        const { tolerance } = DIFFICULTY_CONFIG[difficulty];
        setInZone(Math.abs(angleDiff(heading, targetRef.current)) <= tolerance);
    }, [heading, difficulty, gameState]);

    // ── Score ticker: +1 at the difficulty's tick rate while in zone ──────
    useEffect(() => {
        if (gameState !== "playing") return;

        // Uses setTimeout (not setInterval) so tick rate reacts to difficulty changes immediately
        function tick() {
            if (stateRef.current !== "playing") return;
            const { tolerance, tickMs } = DIFFICULTY_CONFIG[diffRef.current];
            if (Math.abs(angleDiff(headingRef.current, targetRef.current)) <= tolerance) {
                scoreRef.current += 1;
                setScore(scoreRef.current);
            }
            timerId = setTimeout(tick, tickMs);
        }

        let timerId = setTimeout(tick, DIFFICULTY_CONFIG[diffRef.current].tickMs);
        return () => clearTimeout(timerId);
    }, [gameState]);

    // ── Countdown timer ───────────────────────────────────────────────────
    useEffect(() => {
        if (gameState !== "playing") return;
        const id = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(id);
                    setGameState("gameover");
                    setHighScore(h => Math.max(h, scoreRef.current));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [gameState]);

    // ── New target heading every 6 seconds to keep the game dynamic ───────
    useEffect(() => {
        if (gameState !== "playing") return;
        const id = setInterval(() => {
            const t = randomTarget();
            targetRef.current = t;
            setTargetHeading(t);
        }, 6000);
        return () => clearInterval(id);
    }, [gameState]);

    // ── Start / reset ─────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        const t = randomTarget();
        targetRef.current = t;
        setTargetHeading(t);
        scoreRef.current = 0;
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setInZone(false);
        setGameState("playing");
    }, []);

    // ── Derived display values ────────────────────────────────────────────
    const timerPct    = timeLeft / GAME_DURATION;
    const timerColor  = timeLeft <= 10 ? DANGER_COLOR : timeLeft <= 20 ? Category.light : ACCENT;
    const isNewBest   = gameState === "gameover" && score > 0 && score >= highScore;
    const activeColor = inZone ? SAFE_COLOR : DANGER_COLOR;
    const { tolerance, color: diffColor } = DIFFICULTY_CONFIG[difficulty];

    // Precise position of the target indicator dot on the compass rim
    const targetRad  = (targetHeading - 90) * (Math.PI / 180); // -90 maps 0° to 12 o'clock
    const dotRadius  = R - 14;
    const targetDotX = R + dotRadius * Math.cos(targetRad) - 7; // 7 = half of 14px dot
    const targetDotY = R + dotRadius * Math.sin(targetRad) - 7;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>COMPASS HUNT</Text>
                <Text style={styles.subtitle}>Rotate device to match the target heading</Text>
            </View>

            {/* Difficulty Selector */}
            <View style={styles.speedRow}>
                {(Object.keys(DIFFICULTY_CONFIG) as DiffLevel[]).map(level => {
                    const cfg    = DIFFICULTY_CONFIG[level];
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

            {/* Target banner: shown only while playing */}
            {gameState === "playing" && (
                <View style={styles.targetBanner}>
                    <Text style={styles.targetBannerLabel}>TARGET</Text>
                    <Text style={[styles.targetBannerVal, { color: inZone ? SAFE_COLOR : TARGET_COLOR }]}>
                        {Math.round(normalize(targetHeading))}°  {toCardinal(targetHeading)}
                    </Text>
                    <View style={[styles.tolerancePill, { backgroundColor: diffColor + "22", borderColor: diffColor + "66" }]}>
                        <Text style={[styles.tolerancePillText, { color: diffColor }]}>±{tolerance}°</Text>
                    </View>
                </View>
            )}

            {/* Compass arena */}
            <View style={styles.arenaSection}>
                <View style={styles.compassDisc}>

                    {/* Subtle inner ring decoration */}
                    <View style={styles.innerRing} />

                    {/* Target arc: borderTopColor trick positioned at targetHeading.
                        The arc is roughly 45° wide visually — the precise in-zone logic
                        uses exact degree math; this is a visual guide only. */}
                    {gameState === "playing" && (
                        <View style={[
                            styles.targetArc,
                            { borderTopColor: inZone ? SAFE_COLOR + "AA" : TARGET_COLOR + "AA" },
                            { transform: [{ rotate: `${targetHeading}deg` }] },
                        ]} />
                    )}

                    {/* Target dot: glowing indicator at exact targetHeading on the rim */}
                    {gameState === "playing" && (
                        <View style={[
                            styles.targetDot,
                            { left: targetDotX, top: targetDotY },
                            { backgroundColor: inZone ? SAFE_COLOR : TARGET_COLOR },
                            { shadowColor: inZone ? SAFE_COLOR : TARGET_COLOR },
                        ]} />
                    )}

                    {/* Rotating compass disc: N/E/S/W + tick marks.
                        Rotates by -heading so N always points toward magnetic north. */}
                    <View style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: `${-heading}deg` }] }]}>

                        {/* Cardinal direction labels */}
                        {([
                            { lbl: "N", angle: 0,   color: DANGER_COLOR, size: 15 },
                            { lbl: "E", angle: 90,  color: palette.onSurfaceVariant, size: 12 },
                            { lbl: "S", angle: 180, color: palette.onSurfaceVariant, size: 12 },
                            { lbl: "W", angle: 270, color: palette.onSurfaceVariant, size: 12 },
                        ]).map(({ lbl, angle, color, size }) => {
                            const rad = (angle - 90) * (Math.PI / 180);
                            const lr  = R - 26;
                            return (
                                <Text key={lbl} style={[styles.compassDir, {
                                    color,
                                    fontSize: size,
                                    fontWeight: lbl === "N" ? "800" : "600",
                                    left: R + lr * Math.cos(rad) - 8,
                                    top:  R + lr * Math.sin(rad) - 10,
                                }]}>
                                    {lbl}
                                </Text>
                            );
                        })}

                        {/* Degree tick marks every 30° (major ticks at cardinal angles) */}
                        {Array.from({ length: 12 }, (_, i) => {
                            const angle   = i * 30;
                            const isMajor = angle % 90 === 0;
                            const tickLen = isMajor ? 12 : 6;
                            const tickW   = isMajor ? 2 : 1;
                            const rad     = (angle - 90) * (Math.PI / 180);
                            const rimR    = R - 6 - tickLen / 2; // center of tick on the rim
                            return (
                                <View key={angle} style={{
                                    position: "absolute",
                                    width: tickW,
                                    height: tickLen,
                                    backgroundColor: isMajor ? palette.outline : palette.outlineVariant,
                                    left: R + rimR * Math.cos(rad) - tickW / 2,
                                    top:  R + rimR * Math.sin(rad) - tickLen / 2,
                                    // Rotate each tick so it radiates outward from the center
                                    transform: [{ rotate: `${angle}deg` }],
                                }} />
                            );
                        })}
                    </View>

                    {/* Needle layer: rotates by +heading so it always points toward current direction.
                        The ACCENT arm points toward where the device is facing. */}
                    <View style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: `${heading}deg` }] }]}>
                        {/* North-pointing arm: long ACCENT line from center to rim */}
                        <View style={{
                            position: "absolute",
                            width: 3,
                            height: R - 22,
                            backgroundColor: ACCENT,
                            left: R - 1.5,
                            top: 22,
                            borderRadius: 2,
                            shadowColor: ACCENT,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.9,
                            shadowRadius: 6,
                            elevation: 5,
                        }} />
                        {/* Needle tip: glowing dot at the arrow end */}
                        <View style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: ACCENT,
                            left: R - 5,
                            top: 18,
                            shadowColor: ACCENT,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 1,
                            shadowRadius: 8,
                            elevation: 6,
                        }} />
                        {/* South-pointing arm: short dark line to balance the visual */}
                        <View style={{
                            position: "absolute",
                            width: 3,
                            height: R / 2 - 10,
                            backgroundColor: palette.outline,
                            left: R - 1.5,
                            top: R + 10,
                            borderRadius: 2,
                        }} />
                    </View>

                    {/* Pivot circle at the needle's rotation center */}
                    <View style={styles.pivotCircle} />

                    {/* Live heading readout centered on the compass */}
                    <View style={[styles.centerReadout, { left: R - 40, top: R - 22 }]}>
                        <Text style={[styles.headingNum, { color: gameState === "playing" && inZone ? SAFE_COLOR : palette.onSurface }]}>
                            {Math.round(normalize(heading))}°
                        </Text>
                        <Text style={styles.headingDirLabel}>{toCardinal(heading)}</Text>
                    </View>

                    {/* On-target / off-target badge at the bottom of the disc */}
                    {gameState === "playing" && (
                        <View style={[styles.zoneBadge, { borderColor: activeColor + "55" }]}>
                            <Text style={[styles.zoneBadgeText, { color: activeColor }]}>
                                {inZone ? "● ON TARGET" : "○ OFF TARGET"}
                            </Text>
                        </View>
                    )}

                    {/* Idle / Game-over overlay */}
                    {(gameState === "idle" || gameState === "gameover") && (
                        <View style={styles.overlay}>
                            <Text style={styles.overlayEmoji}>{gameState === "idle" ? "🧭" : "⏱️"}</Text>
                            <Text style={styles.overlayTitle}>{gameState === "idle" ? "COMPASS HUNT" : "TIME'S UP!"}</Text>
                            {gameState === "idle" ? (
                                <Text style={styles.overlayHint}>
                                    Lay your phone flat and rotate it{"\n"}to match the target compass heading
                                </Text>
                            ) : (
                                <>
                                    <Text style={styles.gameOverScore}>You scored {score} point{score !== 1 ? "s" : ""}</Text>
                                    {isNewBest && <Text style={styles.newBest}>🏆 New High Score!</Text>}
                                </>
                            )}
                            <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
                                <Text style={styles.startBtnText}>{gameState === "idle" ? "START GAME" : "PLAY AGAIN"}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Sensor card: raw magnetometer readings */}
            <View style={styles.sensorCard}>
                <Text style={styles.sensorTitle}>MAGNETOMETER  (μT)</Text>
                <View style={styles.valuesRow}>
                    {([{ label: "X", val: data.x }, { label: "Y", val: data.y }, { label: "Z", val: data.z }]).map(({ label, val }, i) => (
                        <View key={label} style={[styles.valueItem, i > 0 && styles.valueItemBorder]}>
                            <Text style={styles.axisLabel}>{label}</Text>
                            <Text style={styles.axisValue}>{val.toFixed(1)}</Text>
                        </View>
                    ))}
                </View>
                {available === false && (
                    <Text style={styles.unavailable}>Magnetometer unavailable on this device</Text>
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

    // Target info banner
    targetBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: CARD_BG,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: palette.outline,
    },
    targetBannerLabel: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 9,
        color: palette.onSurfaceVariant,
        letterSpacing: 1.5,
    },
    targetBannerVal: {
        fontFamily: Fonts.headlineBold,
        fontSize: 16,
        letterSpacing: 1,
    },
    tolerancePill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    tolerancePillText: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 10,
        letterSpacing: 0.8,
    },

    // Compass
    arenaSection: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    compassDisc: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        borderRadius: R,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: palette.outline,
    },
    innerRing: {
        position: "absolute",
        width: COMPASS_SIZE - 8,
        height: COMPASS_SIZE - 8,
        borderRadius: (COMPASS_SIZE - 8) / 2,
        borderWidth: 1,
        borderColor: palette.outlineVariant,
        left: 4,
        top: 4,
    },
    // Arc drawn via borderTopColor trick; rotation positions it at targetHeading
    targetArc: {
        position: "absolute",
        width: COMPASS_SIZE - 20,
        height: COMPASS_SIZE - 20,
        borderRadius: (COMPASS_SIZE - 20) / 2,
        borderWidth: 7,
        borderColor: "transparent",
        left: 10,
        top: 10,
    },
    // Precise dot at the exact targetHeading angle on the rim
    targetDot: {
        position: "absolute",
        width: 14,
        height: 14,
        borderRadius: 7,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    compassDir: {
        position: "absolute",
        fontFamily: Fonts.headlineBold,
        letterSpacing: 0.5,
    },
    pivotCircle: {
        position: "absolute",
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: palette.surfaceElevated,
        borderWidth: 2,
        borderColor: ACCENT,
        left: R - 6,
        top: R - 6,
    },
    centerReadout: {
        position: "absolute",
        width: 80,
        alignItems: "center",
    },
    headingNum: {
        fontFamily: Fonts.headlineBold,
        fontSize: 22,
        lineHeight: 26,
    },
    headingDirLabel: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 11,
        color: palette.onSurfaceVariant,
        letterSpacing: 2,
    },
    zoneBadge: {
        position: "absolute",
        bottom: 14,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingVertical: 5,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },
    zoneBadgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        letterSpacing: 1.5,
    },

    // Overlay (idle / gameover)
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(10,11,14,0.92)",
        borderRadius: R,
        gap: 8,
        paddingHorizontal: 20,
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
    valuesRow: { flexDirection: "row" },
    valueItem: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 8,
    },
    valueItemBorder: {
        borderLeftWidth: 1,
        borderLeftColor: palette.outline,
    },
    axisLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: ACCENT,
        letterSpacing: 1,
        marginBottom: 2,
    },
    axisValue: {
        fontFamily: Fonts.bodySemibold,
        fontSize: 15,
        color: palette.onSurface,
    },
    unavailable: {
        fontFamily: Fonts.body,
        marginTop: 8,
        color: palette.error,
        fontSize: 12,
        textAlign: "center",
    },
});
