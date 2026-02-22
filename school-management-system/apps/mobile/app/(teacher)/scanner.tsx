import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

export default function ScannerScreen() {
    const [scanning, setScanning] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);

    const simulateScan = () => {
        setScanning(true);
        setTimeout(() => {
            const mockStudent = "Maria Santos (STU-0001)";
            setLastScanned(mockStudent);
            setScanning(false);
            Alert.alert("Attendance Recorded", `${mockStudent} has been marked present.`);
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>QR Attendance Scanner</Text>
                <Text style={styles.subtitle}>Point camera at student&apos;s QR code</Text>

                {/* Camera placeholder */}
                <View style={styles.cameraBox}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        {scanning && <View style={styles.scanLine} />}
                    </View>
                    <Text style={styles.cameraText}>{scanning ? "Scanning..." : "Camera Preview"}</Text>
                </View>

                <TouchableOpacity style={styles.scanButton} onPress={simulateScan} disabled={scanning} activeOpacity={0.8}>
                    <Text style={styles.scanButtonText}>{scanning ? "Scanning..." : "Simulate Scan"}</Text>
                </TouchableOpacity>

                {lastScanned && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Last Scanned</Text>
                        <Text style={styles.resultValue}>{lastScanned}</Text>
                        <View style={styles.presentBadge}><Text style={styles.presentText}>PRESENT ✓</Text></View>
                    </View>
                )}

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>38</Text>
                        <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: theme.colors.destructive }]}>4</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: theme.colors.warning }]}>2</Text>
                        <Text style={styles.statLabel}>Late</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, padding: 20, alignItems: "center" },
    title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 24 },
    cameraBox: { width: "100%", aspectRatio: 1, backgroundColor: "#1a1f3a", borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 20, overflow: "hidden" },
    scanFrame: { width: 200, height: 200, position: "relative" },
    corner: { position: "absolute", width: 30, height: 30, borderColor: theme.colors.primary },
    topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
    topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
    scanLine: { position: "absolute", top: "50%", left: 0, right: 0, height: 2, backgroundColor: theme.colors.primary },
    cameraText: { position: "absolute", bottom: 20, color: "rgba(255,255,255,0.4)", fontSize: 13 },
    scanButton: { width: "100%", backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 20, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    scanButtonText: { color: theme.colors.white, fontSize: 15, fontWeight: "700" },
    resultCard: { width: "100%", backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", marginBottom: 20 },
    resultLabel: { fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary },
    resultValue: { fontSize: 16, fontWeight: "800", color: theme.colors.text, marginTop: 4 },
    presentBadge: { backgroundColor: theme.colors.success + "18", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
    presentText: { fontSize: 11, fontWeight: "700", color: theme.colors.success },
    statsRow: { flexDirection: "row", gap: 12, width: "100%" },
    statBox: { flex: 1, backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: theme.colors.border },
    statValue: { fontSize: 24, fontWeight: "800", color: theme.colors.success },
    statLabel: { fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary, marginTop: 2 },
});
