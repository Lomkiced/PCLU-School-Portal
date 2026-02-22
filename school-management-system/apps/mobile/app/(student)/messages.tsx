import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const conversations = [
    { id: "1", name: "Prof. Garcia", message: "Your quiz score is posted.", time: "2m", unread: 1 },
    { id: "2", name: "Admin Office", message: "Enrollment extended.", time: "1h", unread: 0 },
    { id: "3", name: "Class Group", message: "Anyone have notes?", time: "3h", unread: 8 },
];

export default function StudentMessagesScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}><Text style={styles.title}>Messages</Text></View>
            <View style={styles.searchBox}><TextInput style={styles.input} placeholder="Search..." placeholderTextColor={theme.colors.textSecondary} /></View>
            <FlatList data={conversations} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.conv} activeOpacity={0.7}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.row}><Text style={styles.name}>{item.name}</Text><Text style={styles.time}>{item.time}</Text></View>
                            <Text style={styles.msg} numberOfLines={1}>{item.message}</Text>
                        </View>
                        {item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>}
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
    searchBox: { padding: 20, paddingBottom: 10 },
    input: { backgroundColor: theme.colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: theme.colors.border },
    conv: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary + "18", justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 16, fontWeight: "700", color: theme.colors.primary },
    row: { flexDirection: "row", justifyContent: "space-between" },
    name: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    time: { fontSize: 11, color: theme.colors.textSecondary },
    msg: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 3 },
    badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    badgeText: { fontSize: 10, fontWeight: "700", color: theme.colors.white },
});
