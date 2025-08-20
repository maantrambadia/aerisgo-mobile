import { View, Text } from "react-native";

export default function Tickets() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6">
        <Text className="text-primary font-urbanist-bold text-3xl">
          Tickets
        </Text>
        <Text className="text-primary/70 font-urbanist mt-2">
          Your booked and upcoming flights will appear here.
        </Text>
      </View>
    </View>
  );
}
