import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
    },
});

export default function RootLayout() {
    const hydrate = useAuthStore((s) => s.hydrate);

    useEffect(() => {
        hydrate();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="(teacher)" />
                <Stack.Screen name="(student)" />
                <Stack.Screen name="(parent)" />
            </Stack>
        </QueryClientProvider>
    );
}
