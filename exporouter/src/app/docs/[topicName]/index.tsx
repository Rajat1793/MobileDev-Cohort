import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const TopicName = () => {
  const { topicName } = useLocalSearchParams();
  return (
    <View>
      <Text>TopicName: {topicName} page</Text>
    </View>
  );
};

export default TopicName;

const styles = StyleSheet.create({});
