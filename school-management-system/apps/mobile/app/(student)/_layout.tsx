import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/lib/theme";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
    return (
        <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primary + "18" }]}>
            <Text style={styles.iconText}>{name}</Text>
        </View>
    );
}

export default function StudentTabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
        }}>
            <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} /> }} />
            <Tabs.Screen name="schedule" options={{ title: "Schedule", tabBarIcon: ({ focused }) => <TabIcon name="📅" focused={focused} /> }} />
            <Tabs.Screen name="grades" options={{ title: "Grades", tabBarIcon: ({ focused }) => <TabIcon name="📊" focused={focused} /> }} />
            <Tabs.Screen name="finance" options={{ title: "Finance", tabBarIcon: ({ focused }) => <TabIcon name="💰" focused={focused} /> }} />
            <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ focused }) => <TabIcon name="💬" focused={focused} /> }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: { height: 72, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card },
    tabLabel: { fontSize: 10, fontWeight: "600" },
    iconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    iconText: { fontSize: 18 },
});
