import { useState } from "react";
import { Text, View, StyleSheet, TextInput, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
    <SafeAreaView style={styles.container}>
      {/* Sign In heading */}
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Please sign in to continue</Text>

      {/* Email Input */}
      <Text style={styles.label}>Email Address</Text>
      <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
        {/* Icon inside the TextInput row */}
        <Ionicons name="mail-outline" size={18} color={emailFocused ? "#22c55e" : "#9ca3af"} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />
      </View>

      {/* Password Input */}
      <Text style={styles.label}>Password</Text>
      <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
        {/* Icon inside the TextInput row */}
        <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? "#22c55e" : "#9ca3af"} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
      </View>

      {/* Sign In Button */}
      <View style={styles.button}>
        <Text style={styles.buttonText}>Sign In -&gt;</Text>
      </View>

      {/* Social Sign In */}
      {/* facebook google and instagram in black with border outside */}
      <View style={{ flexDirection: "row", marginTop: 40 }}>
        <Ionicons name="logo-facebook" size={24} color="#000" style={{ marginHorizontal: 12, borderWidth: 1, borderColor: "#9e9c9c", borderRadius: 12, padding: 10 }} />
        <Ionicons name="logo-google" size={24} color="#000" style={{ marginHorizontal: 12, borderWidth: 1, borderColor: "#9e9c9c", borderRadius: 12, padding: 10 }} />
        <Ionicons name="logo-instagram" size={24} color="#000" style={{ marginHorizontal: 12, borderWidth: 1, borderColor: "#9e9c9c", borderRadius: 12, padding: 10 }} />
      </View>

      {/* Footer links */}
      <Text style={styles.footerText}>
        Don't have an account? <Text style={styles.link}>Sign Up</Text>
      </Text>
      <Text style={[styles.link, { marginTop: 8 }]}>Forgot Password?</Text>
    </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito_700Bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 24,
  },
  label: {
    alignSelf: "flex-start",
    width: "100%",
    fontSize: 14,
    fontFamily: "Nunito_700Bold",   // Bold label
    color: "#111827",
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",           // Icon + TextInput side by side
    alignItems: "center",
    width: "100%",
    height: 48,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 24,               // Fully rounded pill shape
    paddingHorizontal: 14,
    backgroundColor: "#f9fafb",
  },
  inputFocused: {
    borderColor: "#22c55e",         // Green border on focus
    backgroundColor: "#f0fdf4",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#111827",
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "#16a34a",
    borderRadius: 24,
    marginTop: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
  },
  footerText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#374151",
    marginTop: 20,
  },
  link: {
    fontFamily: "Nunito_600SemiBold",
    color: "#16a34a",
    fontSize: 14,
  },
});
