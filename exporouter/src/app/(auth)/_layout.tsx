import { Stack } from "expo-router";

export default function AuthLayout() {
  const isLoggedIn = false; // Replace with your actual authentication logic
  return (
    <Stack>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="signup" options={{ headerShown: true }} />
      </Stack.Protected>
    </Stack>
  );
}
