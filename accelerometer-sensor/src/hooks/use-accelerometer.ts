import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

/**
 * useAccelerometer
 * ----------------
 * Custom hook that wraps expo-sensors Accelerometer.
 *
 * Returns:
 *   available — true if hardware sensor exists, false if not, null while checking
 *   x, y, z   — acceleration values in g-force (gravity units)
 *               x: left(-) / right(+)  tilt
 *               y: down(-) / up(+)     tilt
 *               z: screen-facing(-) / away(+)
 *
 * Update interval is set to 100ms (10 readings/sec).
 * The listener is cleaned up automatically when the component unmounts.
 */
export function useAccelerometer() {
    // null = not yet determined, true = available, false = not available
    const [available, setAvailable] = useState<boolean | null>(null);

    // Raw accelerometer axis values (in g, i.e. multiples of 9.8 m/s²)
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [z, setZ] = useState(0);
    
    useEffect(() => {
        // Will hold the subscription object so we can remove it on cleanup
        let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;

        (async () => {
            // 1. isAvailableAsync() — check if the device has an accelerometer
            const isAvailable = await Accelerometer.isAvailableAsync();
            setAvailable(isAvailable);
            if (!isAvailable) return; // bail early on simulators / unsupported devices

            // 2. setUpdateInterval() — how often to receive new readings (ms)
            Accelerometer.setUpdateInterval(100);

            // 3. addListener() — subscribe; callback fires every update interval
            subscription = Accelerometer.addListener(({ x, y, z }) => {
                setX(x);
                setY(y);
                setZ(z);
            });
        })();

        // 4. Cleanup — remove() unsubscribes when the component unmounts
        return () => subscription?.remove();
    }, []); // empty deps = run once on mount

    return { available, x, y, z };
}