import { useEffect, useState } from 'react';
import { DeviceMotion } from 'expo-sensors';

export function useDeviceMotion() {
    // null = not yet determined, true = available, false = not available
    const [available, setAvailable] = useState<boolean | null>(null);

    // DeviceMotion provides both acceleration and rotation data in one listener
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
    const [rotation, setRotation] = useState({ alpha: 0, beta: 0, gamma: 0 });

    useEffect(() => {
        // Will hold the subscription object so we can remove it on cleanup
        let subscription: ReturnType<typeof DeviceMotion.addListener> | undefined;
        (async () => {
            // 1. isAvailableAsync() — check if the device supports DeviceMotion
            const isAvailable = await DeviceMotion.isAvailableAsync();
            setAvailable(isAvailable);
            if (!isAvailable) return; // bail early on simulators / unsupported devices

            // 2. setUpdateInterval() — how often to receive new readings (ms)
            DeviceMotion.setUpdateInterval(100);

            // 3. addListener() — subscribe; callback fires every update interval
            //    Destructure both fields from the motion data, not from state.
            subscription = DeviceMotion.addListener((motionData) => {
                if (motionData.acceleration) setAcceleration(motionData.acceleration);
                if (motionData.rotation)     setRotation(motionData.rotation);
            });
        })();

        // 4. Cleanup — remove() unsubscribes when the component unmounts
        return () => subscription?.remove();
    }, []); // empty deps = run once on mount

    return { available, acceleration, rotation };
}  