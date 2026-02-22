import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const grades = [
    { id: "1", code: "CS101", name: "Intro to Programming", grade: "1.25", status: "Passing" },
    { id: "2", code: "IT202", name: "Data Structures", grade: "1.50", status: "Passing" },
    { id: "3", code: "MATH201", name: "Calculus II", grade: "2.00", status: "Passing" },
    { id: "4", code: "ENG102", name: "Technical Writing", grade: "1.75", status: "Passing" },
    { id: "5", code: "PE101", name: "Physical Fitness", grade: "1.00", status: "Passing" },
];

export default function ChildGradesScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.title}>Maria&apos;s Grades</Text>
                <Text style={styles.sub}>BSIT 2A · 2nd Semester</Text>
            </View>
            <View style={styles.gwaCard}>
                <Text style={styles.gwaLabel}>GWA</Text>
                <Text style={styles.gwaValue}>1.45</Text>
                <Text style={styles.gwaAward}>🏆 Dean&apos;s List</Text>
            </View>
            <FlatList data={grades} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.code}>{item.code} — {item.name}</Text>
                            <Text style={styles.status}>{item.status}</Text>
                        </View>
                        <Text style={styles.grade}>{item.grade}</Text>
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
    gwaCard: { margin: 20, backgroundColor: "#8b5cf6", borderRadius: 20, padding: 24, alignItems: "center" },
    gwaLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
    gwaValue: { fontSize: 42, fontWeight: "900", color: theme.colors.white, marginTop: 4 },
    gwaAward: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.9)", marginTop: 4 },
    card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border },
    code: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
    status: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    grade: { fontSize: 20, fontWeight: "900", color: theme.colors.success },
});
