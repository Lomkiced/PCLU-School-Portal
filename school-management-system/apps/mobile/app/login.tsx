import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { theme } from "@/lib/theme";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const handleLogin = async () => {
        if (!email || !password) { setError("Please fill in all fields"); return; }
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const { accessToken, user } = res.data.data;
            await setAuth(user, accessToken);
            switch (user.role) {
                case "TEACHER": router.replace("/(teacher)"); break;
                case "STUDENT": router.replace("/(student)"); break;
                case "PARENT": router.replace("/(parent)"); break;
                default: router.replace("/login");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.inner}>
                {/* Logo */}
                <View style={styles.logoBox}>
                    <Text style={styles.logoText}>P</Text>
                </View>
                <Text style={styles.title}>PCLU Portal</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>

                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@pclu.edu.ph" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.colors.textSecondary} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry placeholderTextColor={theme.colors.textSecondary} />
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                    {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.buttonText}>Sign In</Text>}
                </TouchableOpacity>

                <Text style={styles.footer}>© 2026 Polytechnic College of La Union</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
    logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    logoText: { color: theme.colors.white, fontSize: 24, fontWeight: "800" },
    title: { fontSize: 24, fontWeight: "800", textAlign: "center", color: theme.colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: "center", marginBottom: 32 },
    errorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, marginBottom: 16 },
    errorText: { color: theme.colors.destructive, fontSize: 13, fontWeight: "600", textAlign: "center" },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: "600", color: theme.colors.text, marginBottom: 6 },
    input: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: theme.colors.text },
    button: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: "700" },
    footer: { fontSize: 11, color: theme.colors.textSecondary, textAlign: "center", marginTop: 32 },
});
