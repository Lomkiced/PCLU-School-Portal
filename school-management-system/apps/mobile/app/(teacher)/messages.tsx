import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

const conversations = [
    { id: "1", name: "Maria Santos", message: "Thank you!", time: "2m", unread: 2, online: true },
    { id: "2", name: "Admin Office", message: "Meeting tomorrow at 2PM.", time: "1h", unread: 0, online: false },
    { id: "3", name: "Juan Dela Cruz", message: "When is the deadline?", time: "3h", unread: 1, online: true },
    { id: "4", name: "Faculty Group", message: "Grades submission reminder", time: "5h", unread: 5, online: false },
];

export default function MessagesScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}><Text style={styles.title}>Messages</Text></View>
            <View style={styles.searchBox}>
                <TextInput style={styles.searchInput} placeholder="Search conversations..." placeholderTextColor={theme.colors.textSecondary} />
            </View>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.convCard} activeOpacity={0.7}>
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                            {item.online && <View style={styles.onlineDot} />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.time}>{item.time}</Text>
                            </View>
                            <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
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
    searchInput: { backgroundColor: theme.colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: theme.colors.border },
    convCard: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 12 },
    avatarWrap: { position: "relative" },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary + "18", justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 16, fontWeight: "700", color: theme.colors.primary },
    onlineDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.success, borderWidth: 2, borderColor: theme.colors.background },
    nameRow: { flexDirection: "row", justifyContent: "space-between" },
    name: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    time: { fontSize: 11, color: theme.colors.textSecondary },
    message: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 3 },
    badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
    badgeText: { fontSize: 10, fontWeight: "700", color: theme.colors.white },
});
