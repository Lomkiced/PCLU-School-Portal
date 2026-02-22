import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const grades = [
    { id: "1", student: "Maria Santos", subject: "CS101", midterm: 92, finals: null, status: "Pending" },
    { id: "2", student: "Juan Dela Cruz", subject: "CS101", midterm: 85, finals: null, status: "Pending" },
    { id: "3", student: "Ana Garcia", subject: "IT202", midterm: 88, finals: 90, status: "Submitted" },
    { id: "4", student: "Pedro Reyes", subject: "IT202", midterm: 78, finals: 82, status: "Submitted" },
    { id: "5", student: "Rosa Lopez", subject: "MATH201", midterm: 95, finals: null, status: "Pending" },
];

export default function GradebookScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}><Text style={styles.title}>Gradebook</Text></View>
            <FlatList
                data={grades}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, gap: 10 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.student}>{item.student}</Text>
                            <Text style={styles.subject}>{item.subject}</Text>
                        </View>
                        <View style={styles.gradeCol}>
                            <Text style={styles.gradeLabel}>Mid</Text>
                            <Text style={styles.gradeValue}>{item.midterm}</Text>
                        </View>
                        <View style={styles.gradeCol}>
                            <Text style={styles.gradeLabel}>Final</Text>
                            <Text style={[styles.gradeValue, !item.finals && { color: theme.colors.warning }]}>{item.finals || "—"}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === "Submitted" ? theme.colors.success + "18" : theme.colors.warning + "18" }]}>
                            <Text style={[styles.statusText, { color: item.status === "Submitted" ? theme.colors.success : theme.colors.warning }]}>{item.status}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
    card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border, gap: 12 },
    student: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    subject: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    gradeCol: { alignItems: "center", width: 40 },
    gradeLabel: { fontSize: 9, fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase" },
    gradeValue: { fontSize: 16, fontWeight: "800", color: theme.colors.text, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: "700" },
});
