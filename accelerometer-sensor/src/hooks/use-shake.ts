import { useEffect, useRef, useState } from "react";
import { DeviceMotion } from "expo-sensors";

// ─── Shake detection tunables ────────────────────────────────────────────────
const DEFAULT_THRESHOLD  = 1.8;   // g-force magnitude that counts as one "spike"
const DEFAULT_MIN_SPIKES = 2;     // how many spikes within the window trigger a shake
const DEFAULT_WINDOW_MS  = 400;   // ms — spikes must cluster inside this window
const DEFAULT_COOLDOWN_MS = 800;  // ms — ignore spikes for this long after a shake fires

/**
 * UseShakeOptions
 *
 * All properties are optional; the defaults above work well for typical "shake to
 * do something" UX. Tune `threshold` higher if the detector fires by accident
 * while the user is walking, lower if it misses deliberate shakes.
 */
export interface UseShakeOptions {
    /** Minimum total acceleration magnitude (g) to count as one spike. Default 1.8. */
    threshold?: number;
    /** Number of spikes that must occur within `windowMs` to fire a shake. Default 2. */
    minSpikes?: number;
    /** Rolling window in ms within which spikes are counted. Default 400. */
    windowMs?: number;
    /** Quiet period in ms after a shake fires before the next one can. Default 800. */
    cooldownMs?: number;
    /** Called every time a shake is detected. */
    onShake?: () => void;
}

/**
 * useShake
 *
 * Core concept:
 *   DeviceMotion provides `acceleration` (linear acceleration WITHOUT gravity, in m/s²
 *   normalised to g-force units by expo-sensors). A deliberate shake creates a sharp
 *   burst of acceleration that far exceeds normal hand-held movement.
 *
 * Detection algorithm:
 *   1. Every 16 ms (~60 fps) compute the 3-D magnitude of the acceleration vector:
 *        magnitude = √(x² + y² + z²)
 *   2. If magnitude exceeds `threshold`, record the current timestamp as a "spike".
 *   3. Discard spikes that are older than `windowMs` from the tail of the spike list.
 *   4. If the remaining spike count reaches `minSpikes`, a shake is detected:
 *        - Increment `shakeCount` state (triggers a re-render for the consumer).
 *        - Call the optional `onShake` callback.
 *        - Clear the spike list and enter a `cooldownMs` quiet period so that one
 *          physical shake doesn't fire multiple times.
 *
 * Why DeviceMotion instead of Accelerometer?
 *   DeviceMotion exposes `acceleration` with gravity already removed by the OS, so
 *   the resting magnitude is ~0 regardless of device orientation. This makes the
 *   threshold consistent across all orientations without needing to subtract gravity
 *   manually (as you would with raw Accelerometer data).
 *
 * @returns `{ shakeCount, lastShakeAt, available }`
 *   - `shakeCount`  — total shakes detected since the hook mounted (increments on each shake).
 *   - `lastShakeAt` — `Date` of the most recent shake, or `null` if none yet.
 *   - `available`   — whether DeviceMotion is supported on this device.
 */
export function useShake({
    threshold   = DEFAULT_THRESHOLD,
    minSpikes   = DEFAULT_MIN_SPIKES,
    windowMs    = DEFAULT_WINDOW_MS,
    cooldownMs  = DEFAULT_COOLDOWN_MS,
    onShake,
}: UseShakeOptions = {}) {
    const [available, setAvailable]       = useState<boolean | null>(null);
    const [shakeCount, setShakeCount]     = useState(0);
    const [lastShakeAt, setLastShakeAt]   = useState<Date | null>(null);

    // Refs hold mutable state that should NOT trigger re-renders mid-detection
    const spikesRef     = useRef<number[]>([]);  // timestamps of recent spikes
    const cooldownRef   = useRef(false);          // true while in the quiet period after a shake
    const shakeCountRef = useRef(0);              // mirrors shakeCount without stale-closure risk
    const onShakeRef    = useRef(onShake);

    // Keep the callback ref current so consumers can pass a fresh closure each render
    useEffect(() => { onShakeRef.current = onShake; }, [onShake]);

    useEffect(() => {
        let subscription: ReturnType<typeof DeviceMotion.addListener> | undefined;

        (async () => {
            const isAvailable = await DeviceMotion.isAvailableAsync();
            setAvailable(isAvailable);
            if (!isAvailable) return;

            // 16 ms ≈ 60 fps — high rate so fast shakes are not missed
            DeviceMotion.setUpdateInterval(16);

            subscription = DeviceMotion.addListener((motionData) => {
                // `acceleration` is gravity-compensated (m/s² divided by g in expo-sensors)
                const acc = motionData.acceleration;
                if (!acc) return; // may be null on some devices

                // Step 1: compute total acceleration magnitude
                const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

                // Step 2: record spike if above threshold and not in cooldown
                if (magnitude >= threshold && !cooldownRef.current) {
                    const now = Date.now();
                    spikesRef.current.push(now);

                    // Step 3: discard spikes outside the rolling window
                    spikesRef.current = spikesRef.current.filter(t => now - t <= windowMs);

                    // Step 4: check if enough spikes have clustered
                    if (spikesRef.current.length >= minSpikes) {
                        // --- Shake detected! ---
                        spikesRef.current = [];
                        cooldownRef.current = true;

                        shakeCountRef.current += 1;
                        const shakeDate = new Date();

                        setShakeCount(shakeCountRef.current);
                        setLastShakeAt(shakeDate);
                        onShakeRef.current?.();

                        // Lift the cooldown after `cooldownMs`
                        setTimeout(() => { cooldownRef.current = false; }, cooldownMs);
                    }
                }
            });
        })();

        return () => subscription?.remove();
        // Re-subscribe only when detection parameters change
    }, [threshold, minSpikes, windowMs, cooldownMs]);

    return { shakeCount, lastShakeAt, available };
}
