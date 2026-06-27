import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Category, Fonts, palette, Typography } from "@/constants/theme";

const DEMOS = [
    {
        route: "/tilt-game",
        emoji: "🎮",
        title: "Tilt Ball Game",
        description: "Roll the glowing ball into targets\nby tilting your device",
        badge: "ACCELEROMETER",
        badgeColor: Category.accelerometer,
    },
    {
        route: "/gyroscope-game",
        emoji: "⚖️",
        title: "Gyro Balance",
        description: "Keep the glowing ball on the beam\nas it shrinks — tilt to balance!",
        badge: "GYROSCOPE",
        badgeColor: Category.gyroscope,
    },
    {
        route: "/light-game",
        emoji: "💡",
        title: "Light Control",
        description: "Cover or expose the light sensor\nto keep brightness in the target zone",
        badge: "LIGHT SENSOR",
        badgeColor: Category.light,
    },
    {
        route: "/compass-game",
        emoji: "🧭",
        title: "Compass Hunt",
        description: "Lay your phone flat and rotate it\nto match the target compass heading",
        badge: "MAGNETOMETER",
        badgeColor: Category.magnetometer,
    },
    {
        route: "/shake-detector",
        emoji: "📳",
        title: "Shake Detector",
        description: "Shake your device to trigger events\nand track your shake streak",
        badge: "DEVICE MOTION",
        badgeColor: Category.motion,
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
        backgroundColor: palette.background,
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
        borderBottomColor: palette.outlineVariant,
    },
    title: {
        fontFamily: Fonts.headlineBold,
        fontSize: 30,
        color: palette.onSurface,
        letterSpacing: 6,
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: palette.onSurfaceVariant,
        letterSpacing: 1,
        marginTop: 4,
    },
    list: {
        gap: 16,
    },
    card: {
        backgroundColor: palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.outline,
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
        ...Typography.badge,
    },
    cardTitle: {
        fontFamily: Fonts.headlineSemibold,
        fontSize: 17,
        color: palette.onSurface,
        letterSpacing: -0.2,
    },
    cardDesc: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: palette.onSurfaceVariant,
        lineHeight: 18,
    },
    arrow: {
        fontSize: 28,
        color: palette.onSurfaceVariant,
        fontWeight: "300",
    },
});
