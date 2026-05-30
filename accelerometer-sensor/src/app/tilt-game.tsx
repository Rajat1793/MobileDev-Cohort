import { useAccelerometer } from "@/hooks/use-accelerometer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Game dimension constants ---
const BALL_SIZE = 26;              // diameter of the player ball in px
const TARGET_SIZE = 50;            // diameter of the collect target in px
const HALF_BALL = BALL_SIZE / 2;
const HALF_TARGET = TARGET_SIZE / 2;
const GAME_DURATION = 30;          // seconds per round

// Papaya orange dark mode palette
const ACCENT = "#FF6B2B";        // papaya orange
const TARGET_COLOR = "#FFB347";  // light orange / mango
const CARD_BG = "#1C1410";       // very dark warm brown
const SURFACE = "#120D09";       // near-black warm

type GameState = "idle" | "playing" | "gameover";
type SpeedLevel = "slow" | "normal" | "fast" | "insane";

/**
 * SPEED_CONFIG
 * Each level tweaks two physics constants:
 *   acc      — how strongly accelerometer input accelerates the ball (higher = more responsive)
 *   friction — velocity multiplier applied every frame (lower = ball stops sooner)
 */
const SPEED_CONFIG: Record<SpeedLevel, { label: string; acc: number; friction: number; color: string }> = {
    slow:   { label: "SLOW",   acc: 0.28, friction: 0.84, color: "#FFCBA4" },
    normal: { label: "NORMAL", acc: 0.55, friction: 0.88, color: ACCENT },
    fast:   { label: "FAST",   acc: 1.0,  friction: 0.91, color: "#FF8C42" },
    insane: { label: "😈 INSANE", acc: 1.8, friction: 0.94, color: "#FF3D00" },
};

/** Clamp v between min and max (inclusive). */
function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

/** Pick a random position inside the arena, keeping the target fully visible. */
function randomTargetPos(arenaW: number, arenaH: number) {
    const margin = HALF_TARGET + 12;
    return {
        x: (Math.random() - 0.5) * (arenaW - margin * 2),
        y: (Math.random() - 0.5) * (arenaH - margin * 2),
    };
}

export function TiltGame() {
    const insets = useSafeAreaInsets();
    const { width: screenW, height: screenH } = useWindowDimensions();
    const { available, x, y, z } = useAccelerometer();

    // Arena dimensions derived from screen size (leaves 20px padding each side)
    const arenaW = screenW - 40;
    const arenaH = screenH * 0.44;

    // --- Game state ---
    const [gameState, setGameState] = useState<GameState>("idle");
    const [speed, setSpeed] = useState<SpeedLevel>("normal");    // selected difficulty
    const speedRef = useRef<SpeedLevel>("normal");               // ref so physics loop reads latest without re-mounting
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [ballPos, setBallPos] = useState({ x: 0, y: 0 });      // for rendering only
    const [target, setTarget] = useState(() => randomTargetPos(arenaW, arenaH));

    // --- Refs for physics (avoid stale closures inside setInterval) ---
    const velRef = useRef({ x: 0, y: 0 });   // current ball velocity
    const ballRef = useRef({ x: 0, y: 0 });  // current ball position (source of truth)
    const accRef = useRef({ x: 0, y: 0 });   // latest accelerometer reading
    const scoreRef = useRef(0);               // score without triggering re-renders mid-loop
    const targetRef = useRef(target);         // latest target position

    // Keep refs in sync with latest state/prop values every render
    useEffect(() => { accRef.current = { x, y }; }, [x, y]);
    useEffect(() => { targetRef.current = target; }, [target]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    // Physics loop (~60fps)
    // Runs only while gameState === "playing"; cleaned up on pause/end.
    // Uses refs instead of state so the interval doesn't need to re-register on every render.
    useEffect(() => {
        if (gameState !== "playing") return;
        // Snapshot initial speed config for the arena boundary calculation
        const { acc: ACC_SCALE, friction: FRICTION } = SPEED_CONFIG[speedRef.current];
        // Max offset from center before the ball hits a wall
        const maxX = arenaW / 2 - HALF_BALL;
        const maxY = arenaH / 2 - HALF_BALL;

        const id = setInterval(() => {
            // Read latest speed each tick — user can change speed mid-game
            const { acc: curAcc, friction: curFriction } = SPEED_CONFIG[speedRef.current];

            // Accelerometer x tilts right(+)/left(-); y is inverted for natural feel
            velRef.current.x = (velRef.current.x + accRef.current.x * curAcc) * curFriction;
            velRef.current.y = (velRef.current.y - accRef.current.y * curAcc) * curFriction;

            // Clamp ball position to arena bounds
            let nx = clamp(ballRef.current.x + velRef.current.x, -maxX, maxX);
            let ny = clamp(ballRef.current.y + velRef.current.y, -maxY, maxY);

            // Bounce off walls with energy loss (multiply by -0.4 reverses + dampens)
            if (Math.abs(nx) >= maxX) velRef.current.x *= -0.4;
            if (Math.abs(ny) >= maxY) velRef.current.y *= -0.4;

            ballRef.current = { x: nx, y: ny };

            // Collision: Euclidean distance between ball centre and target centre
            const dx = nx - targetRef.current.x;
            const dy = ny - targetRef.current.y;
            if (Math.sqrt(dx * dx + dy * dy) < HALF_BALL + HALF_TARGET) {
                // Ball overlaps target — score a point, teleport target to new spot
                scoreRef.current += 1;
                setScore(scoreRef.current);
                const newT = randomTargetPos(arenaW, arenaH);
                targetRef.current = newT;
                setTarget(newT);
            }

            // Push new position to state so React re-renders the ball
            setBallPos({ x: nx, y: ny });
        }, 16);

        return () => clearInterval(id);
    }, [gameState, arenaW, arenaH]);

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

    const startGame = useCallback(() => {
        scoreRef.current = 0;
        velRef.current = { x: 0, y: 0 };
        ballRef.current = { x: 0, y: 0 };
        const t = randomTargetPos(arenaW, arenaH);
        targetRef.current = t;
        setTarget(t);
        setBallPos({ x: 0, y: 0 });
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setGameState("playing");
    }, [arenaW, arenaH]);

    const timerPct = timeLeft / GAME_DURATION;
    const timerColor = timeLeft <= 10 ? "#FF3D00" : timeLeft <= 20 ? "#FF8C42" : ACCENT;
    const isNewBest = gameState === "gameover" && score > 0 && score >= highScore;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>TILT BALL</Text>
                <Text style={styles.subtitle}>Roll into the glowing target</Text>
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

            {/* Game Arena */}
            <View style={[styles.arena, { width: arenaW, height: arenaH }]}>
                <View style={styles.crossH} />
                <View style={styles.crossV} />

                {/* Corner accents */}
                {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([cx, cy], i) => (
                    <View key={i} style={[styles.cornerDot, {
                        left: cx === -1 ? 10 : undefined,
                        right: cx === 1 ? 10 : undefined,
                        top: cy === -1 ? 10 : undefined,
                        bottom: cy === 1 ? 10 : undefined,
                    }]} />
                ))}

                {(gameState === "idle" || gameState === "gameover") && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayEmoji}>{gameState === "idle" ? "🎮" : "⏱️"}</Text>
                        <Text style={styles.overlayTitle}>{gameState === "idle" ? "TILT BALL" : "TIME'S UP!"}</Text>
                        {gameState === "idle" ? (
                            <Text style={styles.overlayHint}>Tilt your device to roll the ball{"\n"}into the glowing green target</Text>
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

                {gameState === "playing" && (
                    <>
                        {/* Target outer pulse ring */}
                        <View style={[styles.targetRing, {
                            transform: [{ translateX: target.x }, { translateY: target.y }],
                        }]} />
                        {/* Target */}
                        <View style={[styles.target, {
                            transform: [{ translateX: target.x }, { translateY: target.y }],
                        }]} />
                        {/* Ball */}
                        <View style={[styles.ball, {
                            transform: [{ translateX: ballPos.x }, { translateY: ballPos.y }],
                        }]} />
                    </>
                )}
            </View>

            {/* Sensor Card */}
            <View style={styles.sensorCard}>
                <Text style={styles.sensorTitle}>ACCELEROMETER</Text>
                <View style={styles.valuesRow}>
                    {([{ label: "X", val: x }, { label: "Y", val: y }, { label: "Z", val: z }]).map(({ label, val }, i) => (
                        <View key={label} style={[styles.valueItem, i > 0 && styles.valueItemBorder]}>
                            <Text style={styles.axisLabel}>{label}</Text>
                            <Text style={styles.axisValue}>{val.toFixed(3)}</Text>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, {
                                    width: `${Math.min(Math.abs(val) * 100, 100)}%`,
                                    backgroundColor: val >= 0 ? ACCENT : "#FF3D00",
                                }]} />
                            </View>
                        </View>
                    ))}
                </View>
                {available === false && (
                    <Text style={styles.unavailable}>Sensor unavailable on this device</Text>
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
    header: {
        alignItems: "center",
    },
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
    timerBox: {
        flex: 1.5,
    },
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
        backgroundColor: SURFACE,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#2E1A0A",
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    crossH: {
        position: "absolute",
        width: "100%",
        height: 1,
        backgroundColor: "#1E0F06",
    },
    crossV: {
        position: "absolute",
        width: 1,
        height: "100%",
        backgroundColor: "#1E0F06",
    },
    cornerDot: {
        position: "absolute",
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#3A1F0A",
    },

    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(16,8,4,0.90)",
        gap: 8,
    },
    overlayEmoji: {
        fontSize: 42,
    },
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

    // Target
    targetRing: {
        position: "absolute",
        width: TARGET_SIZE + 22,
        height: TARGET_SIZE + 22,
        borderRadius: (TARGET_SIZE + 22) / 2,
        borderWidth: 1,
        borderColor: `${TARGET_COLOR}35`,
    },
    target: {
        position: "absolute",
        width: TARGET_SIZE,
        height: TARGET_SIZE,
        borderRadius: TARGET_SIZE / 2,
        backgroundColor: `${TARGET_COLOR}18`,
        borderWidth: 2,
        borderColor: TARGET_COLOR,
        shadowColor: TARGET_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 6,
    },

    // Ball
    ball: {
        position: "absolute",
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: BALL_SIZE / 2,
        backgroundColor: ACCENT,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 8,
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
    valuesRow: {
        flexDirection: "row",
    },
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
        marginBottom: 6,
    },
    barBg: {
        width: "100%",
        height: 3,
        backgroundColor: "#2E1A0A",
        borderRadius: 2,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 2,
    },
    unavailable: {
        marginTop: 8,
        color: "#FF3D00",
        fontSize: 12,
        textAlign: "center",
    },
});

export default TiltGame;