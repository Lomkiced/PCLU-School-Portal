import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const classes = [
    { id: "1", code: "CS101", name: "Intro to Programming", section: "BSIT-2A", students: 42, schedule: "MWF 7:00-8:30" },
    { id: "2", code: "IT202", name: "Data Structures", section: "BSIT-3A", students: 38, schedule: "TTh 9:00-10:30" },
    { id: "3", code: "CS101", name: "Intro to Programming", section: "BSIT-2B", students: 40, schedule: "MWF 1:00-2:30" },
    { id: "4", code: "MATH201", name: "Calculus II", section: "BSIT-1B", students: 45, schedule: "TTh 3:00-4:30" },
];

export default function ClassesScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}><Text style={styles.title}>My Classes</Text></View>
            <FlatList
                data={classes}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, gap: 12 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
                        <View style={styles.codeBox}><Text style={styles.code}>{item.code}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.detail}>{item.section} · {item.students} students</Text>
                            <Text style={styles.schedule}>{item.schedule}</Text>
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
    card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 14 },
    codeBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: theme.colors.secondary + "18", justifyContent: "center", alignItems: "center" },
    code: { fontSize: 12, fontWeight: "800", color: theme.colors.secondary },
    name: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
    detail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },
    schedule: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontVariant: ["tabular-nums"] },
});
