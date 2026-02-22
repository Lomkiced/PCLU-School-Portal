import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const fees = [
    { id: "1", type: "Tuition", amount: 15000, paid: 15000, status: "Paid" },
    { id: "2", type: "Miscellaneous", amount: 3500, paid: 2000, status: "Partial" },
    { id: "3", type: "Laboratory", amount: 2000, paid: 2000, status: "Paid" },
    { id: "4", type: "Library", amount: 500, paid: 0, status: "Unpaid" },
    { id: "5", type: "Athletic", amount: 1000, paid: 1000, status: "Paid" },
];

export default function FinanceScreen() {
    const total = fees.reduce((a, f) => a + f.amount, 0);
    const paid = fees.reduce((a, f) => a + f.paid, 0);
    const balance = total - paid;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}><Text style={styles.title}>My Finances</Text></View>
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.summaryLabel}>Total Due</Text>
                    <Text style={styles.summaryValue}>₱{total.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: theme.colors.success }]}>
                    <Text style={styles.summaryLabel}>Paid</Text>
                    <Text style={styles.summaryValue}>₱{paid.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: balance > 0 ? theme.colors.warning : theme.colors.success }]}>
                    <Text style={styles.summaryLabel}>Balance</Text>
                    <Text style={styles.summaryValue}>₱{balance.toLocaleString()}</Text>
                </View>
            </View>
            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
            <FlatList data={fees} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.feeType}>{item.type}</Text>
                            <Text style={styles.feeAmount}>₱{item.amount.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === "Paid" ? theme.colors.success + "18" : item.status === "Partial" ? theme.colors.warning + "18" : theme.colors.destructive + "18" }]}>
                            <Text style={[styles.statusText, { color: item.status === "Paid" ? theme.colors.success : item.status === "Partial" ? theme.colors.warning : theme.colors.destructive }]}>{item.status}</Text>
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
    summaryRow: { flexDirection: "row", gap: 10, padding: 20 },
    summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center" },
    summaryLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
    summaryValue: { fontSize: 16, fontWeight: "800", color: theme.colors.white, marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, paddingHorizontal: 20, marginBottom: 12 },
    card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border },
    feeType: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    feeAmount: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: "700" },
});
