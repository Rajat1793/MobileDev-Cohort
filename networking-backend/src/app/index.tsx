import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";

const BASE_URL = "http://localhost:8081";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Index() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/users`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Validation", "Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to add user");
      }
      const newUser: User = await response.json();
      setUsers((prev) => [newUser, ...prev]);
      setName("");
      setEmail("");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Add User Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Add User</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleAddUser}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add User</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* User List */}
      <Text style={styles.listTitle}>Users</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchUsers()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUsers(true)}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users yet. Add one above!</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardEmail}>{item.email}</Text>
              </View>
              <Text style={styles.cardId}>#{item.id}</Text>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  form: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#a5b4fc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  loader: {
    marginTop: 40,
  },
  errorBox: {
    alignItems: "center",
    marginTop: 40,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 8,
  },
  retryText: {
    color: "#6366f1",
    fontWeight: "600",
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#6366f1",
    fontWeight: "700",
    fontSize: 18,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  cardEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  cardId: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
});
