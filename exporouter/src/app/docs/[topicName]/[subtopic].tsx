import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const SubTopicName = () => {
  const { topicName, subtopic } = useLocalSearchParams();
  return (
    <View>
      <Text>TopicName: {topicName} page</Text>
      <Text>SubTopicName: {subtopic} page</Text>
    </View>
  );
};

export default SubTopicName;

const styles = StyleSheet.create({});
