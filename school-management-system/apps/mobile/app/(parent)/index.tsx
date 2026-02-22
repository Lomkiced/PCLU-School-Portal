import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { theme } from "@/lib/theme";

const PURPLE = "#8b5cf6";

export default function ParentHome() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, Parent! 👨‍👩‍👧</Text>
                        <Text style={styles.sub}>{user?.email}</Text>
                    </View>
                    <TouchableOpacity style={[styles.avatar, { backgroundColor: PURPLE }]} onPress={async () => { await logout(); router.replace("/login"); }}>
                        <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || "P"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Child Info Card */}
                <View style={[styles.childCard, { backgroundColor: PURPLE }]}>
                    <Text style={styles.childLabel}>Your Child</Text>
                    <Text style={styles.childName}>Maria Santos</Text>
                    <Text style={styles.childDetail}>BSIT 2A · AY 2025-2026</Text>
                    <View style={styles.childStats}>
                        <View style={styles.childStat}><Text style={styles.childStatValue}>1.45</Text><Text style={styles.childStatLabel}>GWA</Text></View>
                        <View style={styles.childStat}><Text style={styles.childStatValue}>95%</Text><Text style={styles.childStatLabel}>Attendance</Text></View>
                        <View style={styles.childStat}><Text style={styles.childStatValue}>₱2.5K</Text><Text style={styles.childStatLabel}>Balance</Text></View>
                    </View>
                </View>

                {/* Quick Overview */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {[
                    { icon: "📝", title: "Grade posted: CS101 Quiz 3", detail: "Score: 92/100", time: "2h ago" },
                    { icon: "✅", title: "Attendance: Present", detail: "IT202 - Data Structures", time: "4h ago" },
                    { icon: "💰", title: "Payment reminder", detail: "₱500 Library fee due Mar 15", time: "1d ago" },
                    { icon: "📢", title: "Announcement", detail: "Enrollment period extended", time: "2d ago" },
                ].map((item, i) => (
                    <View key={i} style={styles.activityCard}>
                        <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.activityTitle}>{item.title}</Text>
                            <Text style={styles.activityDetail}>{item.detail}</Text>
                        </View>
                        <Text style={styles.activityTime}>{item.time}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1, padding: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    greeting: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
    sub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
    avatarText: { color: theme.colors.white, fontWeight: "700", fontSize: 16 },
    childCard: { borderRadius: 20, padding: 24, marginBottom: 28 },
    childLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
    childName: { fontSize: 24, fontWeight: "900", color: theme.colors.white, marginTop: 4 },
    childDetail: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
    childStats: { flexDirection: "row", marginTop: 16, gap: 12 },
    childStat: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, alignItems: "center" },
    childStatValue: { fontSize: 18, fontWeight: "800", color: theme.colors.white },
    childStatLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginTop: 2 },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
    activityCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, gap: 12 },
    activityTitle: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
    activityDetail: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    activityTime: { fontSize: 10, color: theme.colors.textSecondary },
});
