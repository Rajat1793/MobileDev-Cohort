import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#FF6B2B";
const CARD_BG = "#1C1410";

const DEMOS = [
    {
        route: "/tilt-game",
        emoji: "🎮",
        title: "Tilt Ball Game",
        description: "Roll the glowing ball into targets\nby tilting your device",
        badge: "ACCELEROMETER",
        badgeColor: ACCENT,
    },
    {
        route: "/gyroscope-game",
        emoji: "⚖️",
        title: "Gyro Balance",
        description: "Keep the glowing ball on the beam\nas it shrinks — tilt to balance!",
        badge: "GYROSCOPE",
        badgeColor: "#FF8C42",
    },
    {
        route: "/light-game",
        emoji: "💡",
        title: "Light Control",
        description: "Cover or expose the light sensor\nto keep brightness in the target zone",
        badge: "LIGHT SENSOR",
        badgeColor: "#FFB347",
    },
    {
        route: "/compass-game",
        emoji: "🧭",
        title: "Compass Hunt",
        description: "Lay your phone flat and rotate it\nto match the target compass heading",
        badge: "MAGNETOMETER",
        badgeColor: "#B4A0FF",
    },
] as const;

export default function Index() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.header}>
                <Text style={styles.title}>SENSOR LAB</Text>
                <Text style={styles.subtitle}>Expo Sensors — choose a demo</Text>
            </View>

            <View style={styles.list}>
                {DEMOS.map(demo => (
                    <TouchableOpacity
                        key={demo.route}
                        style={styles.card}
                        activeOpacity={0.75}
                        onPress={() => router.push(demo.route as any)}
                    >
                        <Text style={styles.emoji}>{demo.emoji}</Text>
                        <View style={styles.cardBody}>
                            <View style={[styles.badge, { backgroundColor: demo.badgeColor + "22", borderColor: demo.badgeColor + "66" }]}>
                                <Text style={[styles.badgeText, { color: demo.badgeColor }]}>{demo.badge}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{demo.title}</Text>
                            <Text style={styles.cardDesc}>{demo.description}</Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#100A06",
        paddingHorizontal: 20,
        gap: 32,
    },
    header: {
        alignItems: "center",
    },
    title: {
        fontSize: 30,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 6,
    },
    subtitle: {
        fontSize: 12,
        color: "#5A3A20",
        letterSpacing: 1,
        marginTop: 4,
    },
    list: {
        gap: 16,
    },
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#2E1A0A",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    emoji: {
        fontSize: 36,
    },
    cardBody: {
        flex: 1,
        gap: 4,
    },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        marginBottom: 2,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1.2,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    cardDesc: {
        fontSize: 12,
        color: "#5A3A20",
        lineHeight: 18,
    },
    arrow: {
        fontSize: 28,
        color: "#5A3A20",
        fontWeight: "300",
    },
});
