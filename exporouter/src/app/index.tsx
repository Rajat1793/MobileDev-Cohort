import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
      <Link href="/about">About</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/profile/123">Go to user Id page</Link>
      <Link href="/user/john_doe">Go to user Name page</Link>
      <Link href="/docs/react">Go to React topic page</Link>
      <Link href="/docs/react/home">Go to Home component page</Link>
      <Link href="/catchallslug/one/two/three/four/five">
        Go to Catch All Slug page
      </Link>
      <Link href="/login">Go to Login page</Link>
      <Link href="/signup">Go to Sign Up page</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
