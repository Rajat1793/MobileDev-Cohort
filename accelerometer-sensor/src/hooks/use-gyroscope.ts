import { useEffect, useState } from 'react';
import { Gyroscope } from 'expo-sensors';

/**
 * useGyroscope
 * ------------
 * Custom hook that wraps expo-sensors Gyroscope.
 *
 * Returns:
 *   available — true if hardware sensor exists, false if not, null while checking
 *   x, y, z   — angular velocity in radians per second (rad/s)
 *               x: pitch (tilting forward/backward)
 *               y: roll  (tilting left/right)  ← used for beam tilt in GyroGame
 *               z: yaw   (rotating flat on a table)
 *
 * Update interval is set to 100ms (10 readings/sec).
 * The listener is cleaned up automatically when the component unmounts.
 */
export function useGyroscope() {
    // null = not yet determined, true = available, false = not available
    const [available, setAvailable] = useState<boolean | null>(null);

    // Raw gyroscope axis values (rad/s)
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [z, setZ] = useState(0);
    
    useEffect(() => {
        // Will hold the subscription object so we can remove it on cleanup
        let subscription: { remove: () => void } | undefined;

        (async () => {
            // 1. Check if the device has a gyroscope
            const isAvailable = await Gyroscope.isAvailableAsync();
            setAvailable(isAvailable);
            if (!isAvailable) return; // bail early on simulators / unsupported devices

            // 2. Set how often to receive new readings (ms)
            Gyroscope.setUpdateInterval(100);

            // 3. Subscribe — callback fires every update interval
            subscription = Gyroscope.addListener(({ x, y, z }) => {
                setX(x);
                setY(y);
                setZ(z);
            });
        })();

        // 4. Cleanup — unsubscribe when the component unmounts
        return () => subscription?.remove();
    }, []); // empty deps = run once on mount

    return { available, x, y, z };  
}
