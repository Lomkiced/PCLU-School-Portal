import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "@/stores/auth-store";
import { theme } from "@/lib/theme";

export default function IndexScreen() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuthStore();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }

        // Route based on role
        switch (user?.role) {
            case "TEACHER":
                router.replace("/(teacher)");
                break;
            case "STUDENT":
                router.replace("/(student)");
                break;
            case "PARENT":
                router.replace("/(parent)");
                break;
            default:
                router.replace("/login");
        }
    }, [isLoading, isAuthenticated, user]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
    },
});
