import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const fees = [
    { id: "1", type: "Tuition", amount: 15000, paid: 15000, status: "Paid" },
    { id: "2", type: "Miscellaneous", amount: 3500, paid: 2000, status: "Partial" },
    { id: "3", type: "Library", amount: 500, paid: 0, status: "Unpaid" },
];

export default function ChildFinanceScreen() {
    const balance = fees.reduce((a, f) => a + f.amount - f.paid, 0);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.title}>Maria&apos;s Finances</Text>
            </View>
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                <Text style={styles.balanceValue}>₱{balance.toLocaleString()}</Text>
                <Text style={styles.balanceDue}>Due: March 15, 2026</Text>
            </View>
            <Text style={styles.sectionTitle}>Fee Details</Text>
            <FlatList data={fees} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.feeType}>{item.type}</Text>
                            <Text style={styles.feeAmount}>₱{item.amount.toLocaleString()} · Paid: ₱{item.paid.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: item.status === "Paid" ? theme.colors.success + "18" : item.status === "Partial" ? theme.colors.warning + "18" : theme.colors.destructive + "18" }]}>
                            <Text style={[styles.badgeText, { color: item.status === "Paid" ? theme.colors.success : item.status === "Partial" ? theme.colors.warning : theme.colors.destructive }]}>{item.status}</Text>
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
    balanceCard: { margin: 20, backgroundColor: theme.colors.warning, borderRadius: 20, padding: 24, alignItems: "center" },
    balanceLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
    balanceValue: { fontSize: 36, fontWeight: "900", color: theme.colors.white, marginTop: 4 },
    balanceDue: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, paddingHorizontal: 20, marginBottom: 12 },
    card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border },
    feeType: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    feeAmount: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: "700" },
});
