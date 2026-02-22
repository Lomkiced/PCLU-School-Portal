import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/lib/theme";

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
    return (
        <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primary + "18" }]}>
            <Text style={[styles.iconText, { color }]}>{name}</Text>
        </View>
    );
}

export default function TeacherTabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.secondary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
        }}>
            <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, focused }) => <TabIcon name="🏠" color={color} focused={focused} /> }} />
            <Tabs.Screen name="classes" options={{ title: "Classes", tabBarIcon: ({ color, focused }) => <TabIcon name="📚" color={color} focused={focused} /> }} />
            <Tabs.Screen name="gradebook" options={{ title: "Grades", tabBarIcon: ({ color, focused }) => <TabIcon name="📝" color={color} focused={focused} /> }} />
            <Tabs.Screen name="scanner" options={{ title: "Scan", tabBarIcon: ({ color, focused }) => <TabIcon name="📷" color={color} focused={focused} /> }} />
            <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ color, focused }) => <TabIcon name="💬" color={color} focused={focused} /> }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: { height: 72, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card },
    tabLabel: { fontSize: 10, fontWeight: "600" },
    iconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    iconText: { fontSize: 18 },
});
