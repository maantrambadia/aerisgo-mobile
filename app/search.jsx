import { View, Text, BackHandler } from "react-native";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

export default function Search() {
  // Block Android hardware back from leaving the main tab
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => sub.remove();
    }, [])
  );
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6">
        <Text className="text-primary font-urbanist-bold text-3xl">Search</Text>
        <Text className="text-primary/70 font-urbanist mt-2">
          Find flights with filters and flexible dates.
        </Text>
      </View>
    </View>
  );
}
