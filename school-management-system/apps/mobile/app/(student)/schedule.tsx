import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const schedule = [
    { id: "1", time: "7:00-8:30", subject: "CS101", name: "Intro to Programming", room: "Lab 1", teacher: "Prof. Garcia" },
    { id: "2", time: "9:00-10:30", subject: "IT202", name: "Data Structures", room: "Lab 2", teacher: "Dr. Reyes" },
    { id: "3", time: "1:00-2:30", subject: "MATH201", name: "Calculus II", room: "Room 204", teacher: "Prof. Santos" },
    { id: "4", time: "3:00-4:30", subject: "ENG102", name: "Technical Writing", room: "Room 101", teacher: "Prof. Torres" },
];

export default function ScheduleScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}><Text style={styles.title}>My Schedule</Text><Text style={styles.sub}>Today · Monday</Text></View>
            <FlatList data={schedule} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: 20, gap: 12 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.timeCol}><Text style={styles.time}>{item.time}</Text></View>
                        <View style={styles.divider} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.code}>{item.subject}</Text>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.detail}>{item.teacher} · {item.room}</Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
    sub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
    card: { flexDirection: "row", backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 14 },
    timeCol: { width: 60, justifyContent: "center" },
    time: { fontSize: 11, fontWeight: "700", color: theme.colors.primary, fontVariant: ["tabular-nums"] },
    divider: { width: 3, borderRadius: 2, backgroundColor: theme.colors.primary },
    code: { fontSize: 12, fontWeight: "800", color: theme.colors.primary },
    name: { fontSize: 15, fontWeight: "700", color: theme.colors.text, marginTop: 2 },
    detail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
});
