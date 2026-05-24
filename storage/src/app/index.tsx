// import { useState } from "react";
// import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // Two real objects used across all demos
// const user = { key: "user", value: JSON.stringify({ name: "Alice", age: 25 }) }
// const session = { key: "session", value: JSON.stringify({ token: "abc123", role: "admin" }) }

// export default function Index() {
//   const [output, setOutput] = useState<string>("")

//   // SetItem — store the user object
//   const saveData = async () => {
//     await AsyncStorage.setItem(user.key, user.value)
//     setOutput(`setItem\nkey: "${user.key}"\nvalue: ${user.value}`)
//   }

//   // GetItem — read back the user object
//   const getData = async () => {
//     const value = await AsyncStorage.getItem(user.key)
//     setOutput(`getItem\nkey: "${user.key}"\nvalue: ${value ?? "null (not found)"}`)
//   }

//   // RemoveItem — delete the user object
//   const removeData = async () => {
//     await AsyncStorage.removeItem(user.key)
//     setOutput(`removeItem\nkey: "${user.key}" removed`)
//   }

//   // GetAllKeys
//   const getAllKeys = async () => {
//     const keys = await AsyncStorage.getAllKeys()
//     setOutput(`getAllKeys\nkeys: [${keys.join(", ")}]`)
//   }

//   // MultiSet — store both objects
//   const saveMultipleItems = async () => {
//     await AsyncStorage.multiSet([
//       [user.key, user.value],
//       [session.key, session.value],
//     ])
//     setOutput(`multiSet\n"${user.key}": ${user.value}\n"${session.key}": ${session.value}`)
//   }

//   // MultiGet — read both objects by key
//   const getMultipleItems = async () => {
//     const values = await AsyncStorage.multiGet([user.key, session.key])
//     const result = values.map(([k, v]) => `"${k}": ${v}`).join("\n")
//     setOutput(`multiGet\n${result}`)
//   }

//   // GetAllKeys + MultiGet — read everything stored
//   const getAllKeysMultiple = async () => {
//     const keys = await AsyncStorage.getAllKeys()
//     const values = await AsyncStorage.multiGet(keys)
//     const result = values.map(([k, v]) => `"${k}": ${v}`).join("\n")
//     setOutput(`getAllKeys + multiGet\n${result || "(storage is empty)"}`)
//   }

//   const buttons: { label: string; onPress: () => void }[] = [
//     { label: "setItem", onPress: saveData },
//     { label: "getItem", onPress: getData },
//     { label: "removeItem", onPress: removeData },
//     { label: "getAllKeys", onPress: getAllKeys },
//     { label: "multiSet", onPress: saveMultipleItems },
//     { label: "multiGet", onPress: getMultipleItems },
//     { label: "getAllKeys + multiGet", onPress: getAllKeysMultiple },
//   ]

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>AsyncStorage Demo</Text>

//       {buttons.map((btn) => (
//         <TouchableOpacity key={btn.label} style={styles.button} onPress={btn.onPress}>
//           <Text style={styles.buttonText}>{btn.label}</Text>
//         </TouchableOpacity>
//       ))}

//       <View style={styles.outputBox}>
//         <Text style={styles.outputLabel}>Output:</Text>
//         <Text style={styles.outputText}>{output || "Press a button to see output"}</Text>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 24,
//     gap: 12,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 8,
//   },
//   button: {
//     backgroundColor: "#4f46e5",
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//     width: "100%",
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   outputBox: {
//     marginTop: 20,
//     backgroundColor: "#f1f5f9",
//     borderRadius: 8,
//     padding: 16,
//     width: "100%",
//   },
//   outputLabel: {
//     fontWeight: "700",
//     marginBottom: 6,
//     color: "#475569",
//   },
//   outputText: {
//     fontSize: 14,
//     color: "#1e293b",
//     fontFamily: "monospace",
//   },
// });

import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SecureStoreScreen() {
  const [output, setOutput] = useState("");

  // setItemAsync
  const saveToken = async () => {
    await SecureStore.setItemAsync(
      "token",
      "abc123"
    );

    setOutput("Token Saved");
  };

  // getItemAsync
  const getToken = async () => {
    const value =
      await SecureStore.getItemAsync(
        "token"
      );

    setOutput(value || "No Token Found");
  };

  // deleteItemAsync
  const deleteToken = async () => {
    await SecureStore.deleteItemAsync(
      "token"
    );

    setOutput("Token Deleted");
  };

  // isAvailableAsync
  const checkAvailability = async () => {
    const available =
      await SecureStore.isAvailableAsync();

    setOutput(
      available
        ? "SecureStore Available"
        : "SecureStore Not Available"
    );
  };

  // Store Object
  const saveObject = async () => {
    const user = {
      name: "Code Snippet",
      role: "Admin",
    };

    await SecureStore.setItemAsync(
      "user",
      JSON.stringify(user)
    );

    setOutput("Object Saved");
  };

  // Read Object
  const getObject = async () => {
    const data =
      await SecureStore.getItemAsync(
        "user"
      );

    if (!data) {
      setOutput("No User Found");
      return;
    }

    const parsed = JSON.parse(data);

    setOutput(
      `${parsed.name} - ${parsed.role}`
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          SecureStore Demo
        </Text>

        <Button
          title="Save Token"
          onPress={saveToken}
        />

        <Button
          title="Get Token"
          onPress={getToken}
        />

        <Button
          title="Delete Token"
          onPress={deleteToken}
        />

        <Button
          title="Check Availability"
          onPress={checkAvailability}
        />

        <Button
          title="Save Object"
          onPress={saveObject}
        />

        <Button
          title="Get Object"
          onPress={getObject}
        />

        <View
          style={{
            marginTop: 30,
            padding: 20,
            borderWidth: 1,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            Output
          </Text>

          <Text
            style={{
              fontSize: 16,
            }}
          >
            {output}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}