import { View, Text } from "react-native";

export default function Profile() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6">
        <Text className="text-primary font-urbanist-bold text-3xl">
          Profile
        </Text>
        <Text className="text-primary/70 font-urbanist mt-2">
          Manage your account and settings.
        </Text>
      </View>
    </View>
  );
}
