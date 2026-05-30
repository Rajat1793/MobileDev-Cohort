import { useGyroscope } from "@/hooks/use-gyroscope";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Game dimension constants ---
const BALL_SIZE = 30;                  // diameter of the ball in px
const BEAM_INITIAL_WIDTH = 260;        // starting beam width in px
const BEAM_MIN_WIDTH = 70;             // narrowest the beam can shrink to
const BEAM_HEIGHT = 14;                // beam thickness in px
const GRAVITY_SCALE = 200;             // base acceleration (px/s²) per radian of tilt

const ACCENT = "#FF6B2B";
const TARGET_COLOR = "#FFB347";
const CARD_BG = "#1C1410";
const SURFACE = "#120D09";

type GameState = "idle" | "playing" | "gameover";
type SpeedLevel = "slow" | "normal" | "fast" | "insane";

/**
 * SPEED_CONFIG
 * Each level tweaks two physics constants:
 *   gravityMult — multiplier on GRAVITY_SCALE (higher = ball rolls faster down a tilt)
 *   dampMult    — velocity multiplier per tick (lower = ball decelerates faster)
 */
const SPEED_CONFIG: Record<SpeedLevel, { label: string; gravityMult: number; dampMult: number; color: string }> = {
    slow:   { label: "SLOW",      gravityMult: 0.45, dampMult: 0.990, color: "#FFCBA4" },
    normal: { label: "NORMAL",    gravityMult: 1.00, dampMult: 0.997, color: ACCENT },
    fast:   { label: "FAST",      gravityMult: 1.80, dampMult: 0.999, color: "#FF8C42" },
    insane: { label: "😈 INSANE", gravityMult: 3.00, dampMult: 1.000, color: "#FF3D00" },
};

/** Clamp v between min and max (inclusive). */
function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

export default function GyroscopeGame() {
    const insets = useSafeAreaInsets();
    const { available, x, y, z } = useGyroscope();

    // --- Game state ---
    const [gameState, setGameState] = useState<GameState>("idle");
    const [speed, setSpeed] = useState<SpeedLevel>("normal");   // selected difficulty
    const speedRef = useRef<SpeedLevel>("normal");              // ref so physics loop reads latest without re-mounting
    const [score, setScore] = useState(0);                      // survival time in seconds
    const [highScore, setHighScore] = useState(0);
    const [beamWidth, setBeamWidth] = useState(BEAM_INITIAL_WIDTH); // rendered beam width
    const [displayTilt, setDisplayTilt] = useState(0);          // tilt angle in radians (for beam rotation)
    const [displayBallX, setDisplayBallX] = useState(0);        // ball offset from beam centre (px)

    // --- Refs for physics (avoid stale closures inside setInterval) ---
    const gyroYRef = useRef(0);             // latest gyroscope Y reading (rad/s)
    const tiltRef = useRef(0);              // integrated tilt angle (radians)
    const ballPosRef = useRef(0);           // ball X offset from beam centre (source of truth)
    const ballVelRef = useRef(0);           // ball velocity along the beam
    const beamWidthRef = useRef(BEAM_INITIAL_WIDTH); // beam width (source of truth)
    const scoreRef = useRef(0);             // score without triggering re-renders mid-loop

    // Keep refs in sync with latest state values every render
    useEffect(() => { gyroYRef.current = y; }, [y]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    // Physics loop ~60fps
    // Runs only while playing; cleaned up on end/pause.
    useEffect(() => {
        if (gameState !== "playing") return;

        const id = setInterval(() => {
            const dt = 0.016; // ~16ms per tick in seconds

            // Integrate gyro Y (rad/s) into a cumulative tilt angle, clamped to ±0.6 rad
            // The 0.985 damping gradually returns the beam to level when the device is still
            tiltRef.current = clamp(tiltRef.current + gyroYRef.current * dt, -0.6, 0.6);
            tiltRef.current *= 0.985;

            // Apply gravity component along the tilted beam (sin converts angle → force direction)
            const { gravityMult, dampMult } = SPEED_CONFIG[speedRef.current];
            const acc = Math.sin(tiltRef.current) * GRAVITY_SCALE * gravityMult;
            ballVelRef.current = (ballVelRef.current + acc * dt) * dampMult;
            ballPosRef.current += ballVelRef.current * dt;

            // Half the usable beam length (ball edge must stay within)
            const halfBeam = beamWidthRef.current / 2 - BALL_SIZE / 2;

            // Ball fell off the end — game over
            if (Math.abs(ballPosRef.current) > halfBeam) {
                setGameState("gameover");
                setHighScore(h => Math.max(h, scoreRef.current));
                return;
            }

            // Push display values to state for rendering
            setDisplayTilt(tiltRef.current);
            setDisplayBallX(ballPosRef.current);
        }, 16);

        return () => clearInterval(id);
    }, [gameState]);

    // Score ticker: +1 every second; beam shrinks 18px every 4 seconds
    useEffect(() => {
        if (gameState !== "playing") return;

        const id = setInterval(() => {
            scoreRef.current += 1;
            setScore(scoreRef.current);

            // Every 4 seconds make balancing harder by narrowing the beam
            if (scoreRef.current % 4 === 0) {
                beamWidthRef.current = Math.max(BEAM_MIN_WIDTH, beamWidthRef.current - 18);
                setBeamWidth(beamWidthRef.current);
            }
        }, 1000);

        return () => clearInterval(id);
    }, [gameState]);

    const startGame = useCallback(() => {
        scoreRef.current = 0;
        tiltRef.current = 0;
        ballPosRef.current = 0;
        ballVelRef.current = 0;
        beamWidthRef.current = BEAM_INITIAL_WIDTH;
        setScore(0);
        setBeamWidth(BEAM_INITIAL_WIDTH);
        setDisplayTilt(0);
        setDisplayBallX(0);
        setGameState("playing");
    }, []);

    // dangerPct goes 0→1 as beam shrinks; drives the beam colour change
    const dangerPct = 1 - (beamWidth - BEAM_MIN_WIDTH) / (BEAM_INITIAL_WIDTH - BEAM_MIN_WIDTH);
    const beamColor = dangerPct > 0.65 ? "#FF3D00" : dangerPct > 0.35 ? "#FF8C42" : ACCENT;
    // Convert tilt radians to degrees for the on-screen indicator label
    const tiltDeg = (displayTilt * 180) / Math.PI;
    const isNewBest = gameState === "gameover" && score > 0 && score >= highScore;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>GYRO BALANCE</Text>
                <Text style={styles.subtitle}>Keep the ball on the shrinking beam</Text>
            </View>

            {/* Speed Selector */}
            <View style={styles.speedRow}>
                {(Object.keys(SPEED_CONFIG) as SpeedLevel[]).map(level => {
                    const cfg = SPEED_CONFIG[level];
                    const active = speed === level;
                    return (
                        <TouchableOpacity
                            key={level}
                            onPress={() => setSpeed(level)}
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
                    <Text style={styles.hudLabel}>TIME</Text>
                    <Text style={styles.hudNumber}>{score}s</Text>
                </View>
                <View style={styles.hudBox}>
                    <Text style={styles.hudLabel}>BEST</Text>
                    <Text style={styles.hudNumber}>{highScore}s</Text>
                </View>
                <View style={[styles.hudBox, { borderColor: beamColor + "66" }]}>
                    <Text style={styles.hudLabel}>BEAM</Text>
                    <Text style={[styles.hudNumber, { color: beamColor }]}>{Math.round(beamWidth)}</Text>
                </View>
            </View>

            {/* Arena */}
            <View style={styles.arena}>
                {gameState === "playing" && (
                    <Text style={styles.tiltIndicator}>
                        {tiltDeg >= 0 ? "← " : "→ "}{Math.abs(tiltDeg).toFixed(1)}°
                    </Text>
                )}

                {/* Beam + Ball rotate as one group so ball always sits on the beam */}
                {gameState === "playing" && (
                    <View style={[styles.beamGroup, { transform: [{ rotate: `${displayTilt}rad` }] }]}>
                        <View style={[styles.ball, {
                            left: beamWidth / 2 + displayBallX - BALL_SIZE / 2,
                            bottom: BEAM_HEIGHT,
                        }]} />
                        <View style={[styles.beam, {
                            width: beamWidth,
                            backgroundColor: beamColor,
                            shadowColor: beamColor,
                        }]} />
                    </View>
                )}

                {(gameState === "idle" || gameState === "gameover") && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayEmoji}>{gameState === "idle" ? "⚖️" : "😵"}</Text>
                        <Text style={styles.overlayTitle}>{gameState === "idle" ? "GYRO BALANCE" : "FELL OFF!"}</Text>
                        {gameState === "idle" ? (
                            <Text style={styles.overlayHint}>
                                Rotate your device left/right to tilt{"\n"}the beam — don't let the ball fall!
                            </Text>
                        ) : (
                            <>
                                <Text style={styles.gameOverScore}>Balanced for {score}s!</Text>
                                {isNewBest && <Text style={styles.newBest}>🏆 New Best!</Text>}
                            </>
                        )}
                        <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
                            <Text style={styles.startBtnText}>{gameState === "idle" ? "START" : "TRY AGAIN"}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Sensor mini card */}
            <View style={styles.sensorCard}>
                <Text style={styles.sensorTitle}>GYROSCOPE  (rad/s)</Text>
                <View style={styles.valuesRow}>
                    {([{ label: "X", val: x }, { label: "Y", val: y }, { label: "Z", val: z }]).map(({ label, val }, i) => (
                        <View key={label} style={[styles.valueItem, i > 0 && styles.valueItemBorder]}>
                            <Text style={styles.axisLabel}>{label}</Text>
                            <Text style={styles.axisValue}>{val.toFixed(3)}</Text>
                        </View>
                    ))}
                </View>
                {available === false && (
                    <Text style={styles.unavailable}>Gyroscope unavailable on this device</Text>
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

    // Speed selector
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
    hud: {
        flexDirection: "row",
        gap: 10,
    },
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
    hudLabel: {
        fontSize: 9,
        fontWeight: "700",
        color: "#5A3A20",
        letterSpacing: 1.5,
    },
    hudNumber: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FFFFFF",
        lineHeight: 30,
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
    tiltIndicator: {
        position: "absolute",
        top: 14,
        fontSize: 13,
        fontWeight: "600",
        color: "#5A3A20",
        letterSpacing: 1,
    },
    beamGroup: {
        position: "relative",
        alignItems: "center",
    },
    beam: {
        height: BEAM_HEIGHT,
        borderRadius: BEAM_HEIGHT / 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 5,
    },
    ball: {
        position: "absolute",
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: BALL_SIZE / 2,
        backgroundColor: TARGET_COLOR,
        shadowColor: TARGET_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 8,
    },

    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(16,8,4,0.90)",
        gap: 8,
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
    valuesRow: { flexDirection: "row" },
    valueItem: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 8,
    },
    valueItemBorder: {
        borderLeftWidth: 1,
        borderLeftColor: "#2E1A0A",
    },
    axisLabel: {
        fontSize: 10,
        color: ACCENT,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 2,
    },
    axisValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    unavailable: {
        marginTop: 8,
        color: "#FF3D00",
        fontSize: 12,
        textAlign: "center",
    },
});
