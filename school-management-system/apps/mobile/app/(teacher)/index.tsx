import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { theme } from "@/lib/theme";

export default function TeacherHome() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();

    const stats = [
        { label: "My Classes", value: "5", icon: "📚", color: theme.colors.secondary },
        { label: "Pending Grades", value: "12", icon: "📝", color: theme.colors.warning },
        { label: "Attendance", value: "87%", icon: "✅", color: theme.colors.success },
        { label: "Messages", value: "3", icon: "💬", color: theme.colors.info },
    ];

    const schedule = [
        { time: "7:00-8:30", subject: "CS101", section: "BSIT-2A", room: "Lab 1", status: "done" },
        { time: "9:00-10:30", subject: "IT202", section: "BSIT-3A", room: "Lab 2", status: "now" },
        { time: "1:00-2:30", subject: "CS101", section: "BSIT-2B", room: "Lab 1", status: "next" },
        { time: "3:00-4:30", subject: "MATH201", section: "BSIT-1B", room: "Room 204", status: "next" },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good Morning! 📖</Text>
                        <Text style={styles.email}>{user?.email}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={async () => { await logout(); router.replace("/login"); }}>
                        <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || "T"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    {stats.map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Today's Schedule */}
                <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
                {schedule.map((item, i) => (
                    <View key={i} style={styles.scheduleCard}>
                        <View style={[styles.scheduleIndicator, { backgroundColor: item.status === "done" ? theme.colors.success : item.status === "now" ? theme.colors.primary : theme.colors.border }]} />
                        <View style={styles.scheduleTime}><Text style={styles.timeText}>{item.time}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.scheduleSubject}>{item.subject}</Text>
                            <Text style={styles.scheduleDetail}>{item.section} · {item.room}</Text>
                        </View>
                        {item.status === "now" && <View style={styles.nowBadge}><Text style={styles.nowText}>NOW</Text></View>}
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
    email: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.secondary, justifyContent: "center", alignItems: "center" },
    avatarText: { color: theme.colors.white, fontWeight: "700", fontSize: 16 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    statCard: { width: "47%", backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
    statValue: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginTop: 8 },
    statLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary, marginTop: 2 },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
    scheduleCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    scheduleIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
    scheduleTime: { width: 70, marginRight: 8 },
    timeText: { fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary, fontVariant: ["tabular-nums"] },
    scheduleSubject: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    scheduleDetail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    nowBadge: { backgroundColor: theme.colors.primary + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    nowText: { fontSize: 10, fontWeight: "800", color: theme.colors.primary },
});
