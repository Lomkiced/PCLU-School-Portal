import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { theme } from "@/lib/theme";

export default function StudentHome() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();

    const stats = [
        { label: "Subjects", value: "6", icon: "📚", color: theme.colors.primary },
        { label: "GWA", value: "1.45", icon: "⭐", color: theme.colors.success },
        { label: "Attendance", value: "95%", icon: "✅", color: theme.colors.info },
        { label: "Balance", value: "₱2.5K", icon: "💰", color: theme.colors.warning },
    ];

    const deadlines = [
        { title: "Quiz 3 - Programming", subject: "CS101", due: "Tomorrow", urgent: true },
        { title: "Activity 5 - Arrays", subject: "IT202", due: "Mar 5", urgent: false },
        { title: "Essay - Data Ethics", subject: "CS101", due: "Mar 8", urgent: false },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome! 🎓</Text>
                        <Text style={styles.sub}>BSIT 2A · 2nd Semester</Text>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={async () => { await logout(); router.replace("/login"); }}>
                        <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || "S"}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                    {stats.map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
                {deadlines.map((d, i) => (
                    <View key={i} style={styles.deadlineCard}>
                        {d.urgent && <View style={styles.urgentDot} />}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.deadlineTitle}>{d.title}</Text>
                            <Text style={styles.deadlineSubject}>{d.subject}</Text>
                        </View>
                        <View style={[styles.dueBadge, d.urgent && { backgroundColor: theme.colors.destructive + "18" }]}>
                            <Text style={[styles.dueText, d.urgent && { color: theme.colors.destructive }]}>{d.due}</Text>
                        </View>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Announcements</Text>
                <View style={styles.announcementCard}>
                    <Text style={styles.announcementTitle}>Enrollment Period Extended</Text>
                    <Text style={styles.announcementBody}>Extended until March 31, 2026.</Text>
                </View>
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
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    avatarText: { color: theme.colors.white, fontWeight: "700", fontSize: 16 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    statCard: { width: "47%", backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
    statValue: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: 6 },
    statLabel: { fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary, marginTop: 2 },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
    deadlineCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, gap: 10 },
    urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.destructive },
    deadlineTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    deadlineSubject: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    dueBadge: { backgroundColor: theme.colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    dueText: { fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary },
    announcementCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 },
    announcementTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    announcementBody: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
});
