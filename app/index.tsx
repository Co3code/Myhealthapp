import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Types for our History
type HistoryItem = {
  id: string;
  bmi: string;
  status: string;
  date: string;
};

const STORAGE_KEY = "@bmi_history";

export default function HomeScreen() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmiValue, setBmiValue] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // --- PERSISTENCE LOGIC ---

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedHistory !== null) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  const saveHistory = async (newHistory: HistoryItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };

  // --- ACTIONS ---

  const calculateHealth = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h) return;

    const bmi = (w / (h * h)).toFixed(1);
    let currentStatus = "";

    if (parseFloat(bmi) < 18.5) currentStatus = "Underweight";
    else if (parseFloat(bmi) <= 24.9) currentStatus = "Healthy";
    else if (parseFloat(bmi) <= 29.9) currentStatus = "Overweight";
    else currentStatus = "Obese";

    setBmiValue(bmi);
    setStatus(currentStatus);

    const newEntry: HistoryItem = {
      id: Date.now().toString(),
      bmi: bmi,
      status: currentStatus,
      date: new Date().toLocaleDateString(),
    };

    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    saveHistory(updatedHistory);

    Keyboard.dismiss();
    animateResult();
  };

  const deleteItem = async (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    await saveHistory(updatedHistory);
  };

  const clearAllHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const animateResult = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      Healthy: "#4CAF50",
      Underweight: "#FF9800",
      Overweight: "#FF9800",
      Obese: "#F44336",
    };
    return colors[s] || "#007AFF";
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.innerContainer}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="175"
                  keyboardType="decimal-pad"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateHealth} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Calculate BMI</Text>
            </TouchableOpacity>

            {bmiValue && (
              <Animated.View style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.bmiNumber}>{bmiValue}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent History</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={clearAllHistory}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No records yet. Start tracking!</Text>}
            ListFooterComponent={<Text style={styles.footerSignature}>v1.0.2-AC</Text>}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <View>
                  <Text style={styles.historyBmi}>{item.bmi}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={[styles.historyStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  innerContainer: { paddingHorizontal: 20, paddingTop: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 20,
  },
  row: { flexDirection: "row" },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 17,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#007AFF",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  resultContainer: { marginTop: 20, alignItems: "center", backgroundColor: "#F8F9FA", borderRadius: 18, padding: 20 },
  bmiNumber: { fontSize: 44, fontWeight: "900", color: "#1C1C1E" },
  statusText: { fontSize: 18, fontWeight: "700", marginTop: -4 },

  // History
  historySection: { flex: 1, paddingHorizontal: 20 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  historyTitle: { fontSize: 19, fontWeight: "800", color: "#1C1C1E" },
  clearText: { color: "#FF3B30", fontWeight: "600", fontSize: 14 },
  emptyText: { textAlign: "center", color: "#8E8E93", marginTop: 20, fontSize: 15 },
  historyItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyBmi: { fontSize: 22, fontWeight: "800", color: "#1C1C1E" },
  historyDate: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
  itemRight: { flexDirection: "row", alignItems: "center" },
  historyStatus: { fontSize: 14, fontWeight: "700", marginRight: 12 },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: { fontSize: 12, color: "#8E8E93", fontWeight: "900" },
  footerSignature: {
    textAlign: "center",
    color: "#D1D1D6",
    fontSize: 10,
    marginTop: 20,
    marginBottom: 10,
  },
});
