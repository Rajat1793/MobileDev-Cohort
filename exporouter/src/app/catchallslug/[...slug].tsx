import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const DynamicPage = () => {
  const { slug } = useLocalSearchParams();
  console.log(slug);
  return (
    <View>
      <Text>DynamicPage</Text>
      <Text>{Array.isArray(slug) ? slug.join("/") : slug}</Text>
    </View>
  );
};

export default DynamicPage;

const styles = StyleSheet.create({});
