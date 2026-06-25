import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    {
        route: "/shake-detector",
        emoji: "📳",
        title: "Shake Detector",
        description: "Shake your device to trigger events\nand track your shake streak",
        badge: "DEVICE MOTION",
        badgeColor: "#60CFFF",
    },
] as const;

export default function Index() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.screen, { paddingTop: insets.top }]}>

            {/* Fixed header — stays pinned while cards scroll */}
            <View style={styles.header}>
                <Text style={styles.title}>SENSIFY</Text>
                <Text style={styles.subtitle}>Expo Sensors — choose a demo</Text>
            </View>

            {/* Scrollable card list */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
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
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#100A06",
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 16,
    },
    header: {
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#1E0F06",
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
