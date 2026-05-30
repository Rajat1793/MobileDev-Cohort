import { useEffect, useState } from "react";
import { LightSensor } from "expo-sensors";

/**
 * useLightSensor
 * --------------
 * Custom hook that wraps expo-sensors LightSensor.
 *
 * Returns:
 *   available   — true if hardware sensor exists, false if not, null while checking
 *   illuminance — ambient light level in lux (0 = dark, ~100 = dim room, ~10000 = sunny day)
 *
 * Update interval is set to 200ms (5 readings/sec).
 * The listener is cleaned up automatically when the component unmounts.
 *
 * Note: LightSensor is only available on Android; returns available=false on iOS/simulator.
 */
export function useLightSensor() {
    // null = not yet determined, true = available, false = not available
    const [available, setAvailable] = useState<boolean | null>(null);

    // Ambient light in lux
    const [illuminance, setIlluminance] = useState(0);

    useEffect(() => {
        // Will hold the subscription so we can remove it on cleanup
        let subscription: ReturnType<typeof LightSensor.addListener> | undefined;

        (async () => {
            // 1. isAvailableAsync() — check if the device has a light sensor
            const isAvailable = await LightSensor.isAvailableAsync();
            setAvailable(isAvailable);
            if (!isAvailable) return; // bail early on unsupported devices / iOS

            // 2. setUpdateInterval() — how often to receive readings (ms)
            LightSensor.setUpdateInterval(200);

            // 3. addListener() — callback fires every update interval
            subscription = LightSensor.addListener(({ illuminance }) => {
                setIlluminance(illuminance);
            });
        })();

        // 4. Cleanup — remove() unsubscribes when the component unmounts
        return () => subscription?.remove();
    }, []); // empty deps = run once on mount

    return { available, illuminance };
}
