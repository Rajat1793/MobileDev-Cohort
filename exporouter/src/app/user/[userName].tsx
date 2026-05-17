import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const UserNameScreen = () => {
  const { userName } = useLocalSearchParams();
  return (
    <View>
      <Text>UserName: {userName} page</Text>
    </View>
  );
};

export default UserNameScreen;

const styles = StyleSheet.create({});
