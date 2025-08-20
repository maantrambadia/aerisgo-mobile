import { View, Text } from "react-native";

export default function Search() {
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
