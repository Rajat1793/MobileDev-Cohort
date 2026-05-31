import { useEffect, useState } from "react";
import { Magnetometer } from "expo-sensors";
import { Platform } from "react-native";

export function useMagnetometer() {
    const [available, setAvailable] = useState<boolean | null>(null);
    const [data, setData] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        let subscription: ReturnType<typeof Magnetometer.addListener> | undefined;

        (async () => {
            const isAvailable = await Magnetometer.isAvailableAsync();
            setAvailable(isAvailable);
            if (!isAvailable) return;

            // iOS devices report magnetometer data at a very high rate by default,
            // which can cause performance issues. Android devices report at a more reasonable rate.
            if (Platform.OS === "ios") {
                Magnetometer.setUpdateInterval(200); // 5 readings/sec
            }

            subscription = Magnetometer.addListener(({ x, y, z }) => {
                setData({ x, y, z });
            });
        })();

        return () => subscription?.remove();
    }, []);

    return { available, data };
}