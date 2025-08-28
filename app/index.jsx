import { Text, View, Image } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import PrimaryButton from "../components/PrimaryButton";
import TicketPreview from "../components/TicketPreview";
import welcomeLogo from "../assets/images/welcome-logo.png";

export default function Welcome() {
  return (
    <View className="flex-1 bg-background">
      {/* Top Section: Brand */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="items-start px-6 pt-8"
      >
        <Image
          source={welcomeLogo}
          resizeMode="contain"
          accessibilityLabel="AerisGo logo"
          className="w-28 h-8"
        />
      </Animated.View>

      {/* Middle Section: Tickets + Headline */}
      <View className="flex-1 justify-center px-6">
        {/* Ticket stack */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100).springify()}
          className="items-center mb-6"
        >
          <View className="relative w-full items-center">
            {/* Back time card */}
            <Animated.View
              entering={FadeInDown.duration(650).delay(150).springify()}
              className="absolute w-11/12 -top-2 left-2 z-0"
            >
              <View className="rotate-[-10deg]">
                <TicketPreview
                  variant="time"
                  from="Dhaka"
                  to="Ottawa"
                  departTime="12:30"
                  arriveTime="11:30"
                  duration="20h 20m"
                />
              </View>
            </Animated.View>
            {/* Middle info list card */}
            <Animated.View
              entering={FadeInDown.duration(650).delay(250).springify()}
              className="absolute left-0 -bottom-6 w-9/12 z-10"
            >
              <View className="rotate-[7deg]">
                <TicketPreview variant="info" />
              </View>
            </Animated.View>
            {/* Foreground boarding pass */}
            <Animated.View
              entering={ZoomIn.duration(700).delay(350).springify()}
              className="relative w-10/12 z-20"
            >
              <View className="rotate-[2deg]">
                <TicketPreview variant="boarding" />
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Headline + Subtext */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(450).springify()}
          className="mt-10"
        >
          <Text className="text-primary font-urbanist-bold text-4xl leading-tight">
            Let's Book{"\n"}Your Next Flight
          </Text>
          <Text className="text-primary opacity-80 font-urbanist-medium text-base mt-3">
            Experience seamless flight booking, exclusive deals, and
            personalized travel options, all in one place.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Section: Actions */}
      <Animated.View
        entering={FadeInUp.duration(650).delay(600).springify()}
        className="px-6 pb-8"
      >
        <PrimaryButton
          title="Continue"
          onPress={() => router.push("/sign-up")}
          withHaptics
          hapticStyle="medium"
          className="w-full mb-3"
        />
        <View className="items-center">
          <Text className="text-primary font-urbanist-medium text-base">
            Already have an account?{" "}
            <Text
              className="font-urbanist-semibold underline"
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                router.push("/sign-in");
              }}
            >
              Sign In
            </Text>
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
