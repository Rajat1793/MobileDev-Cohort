import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const UserIdScreen = () => {
  const { userId } = useLocalSearchParams();
  return (
    <View>
      <Text>UserId: {userId} page</Text>
    </View>
  );
};

export default UserIdScreen;

const styles = StyleSheet.create({});
