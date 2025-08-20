import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

const TicketPreview = ({
  variant = "boarding", // 'time' | 'info' | 'boarding'
  className = "",
  // Common props
  from = "Rajkot",
  to = "Mumbai",
  departTime = "10:30",
  arriveTime = "12:30",
  duration = "2h 20m",
  // Boarding pass props
  airline = "AerisGo",
  codeFrom = "HSR",
  codeTo = "BOM",
  passenger = "Maan Trambadia",
  seat = "AG11",
  gate = "A15",
  flightNo = "AG123",
  dateLabel = "Sat 25 Aug",
  // Info card props
  infoCity = "Mumbai, India",
  infoDate = "25 Aug",
  infoPax = "1 Adult",
}) => {
  if (variant === "time") {
    return (
      <View
        className={`bg-primary rounded-3xl p-5 overflow-visible ${className} shadow-md`}
      >
        <View className="flex-row items-center justify-between">
          <View className="items-start">
            <Text className="text-secondary font-urbanist-semibold text-[11px] opacity-90">
              {from}
            </Text>
            <Text className="text-secondary font-urbanist-bold text-2xl mt-1">
              {departTime}
            </Text>
          </View>
          <View className="items-center">
            <View className="w-9 h-9 rounded-full items-center justify-center border border-secondary/30">
              <Ionicons
                name="airplane"
                size={16}
                color={COLORS.secondary}
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </View>
            <Text className="text-secondary font-urbanist-medium text-[11px] mt-1 opacity-80">
              {duration}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-secondary font-urbanist-semibold text-[11px] opacity-90">
              {to}
            </Text>
            <Text className="text-secondary font-urbanist-bold text-2xl mt-1">
              {arriveTime}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (variant === "info") {
    return (
      <View
        className={`bg-secondary rounded-3xl px-4 py-4 ${className} shadow-md`}
      >
        <View className="gap-3">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.primary}
              />
            </View>
            <Text className="text-primary font-urbanist-medium">
              {infoCity}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons
                name="calendar-outline"
                size={16}
                color={COLORS.primary}
              />
            </View>
            <Text className="text-primary font-urbanist-medium">
              {infoDate}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Ionicons
                name="person-outline"
                size={16}
                color={COLORS.primary}
              />
            </View>
            <Text className="text-primary font-urbanist-medium">{infoPax}</Text>
          </View>
        </View>
      </View>
    );
  }

  // Default: boarding pass
  return (
    <View
      className={`bg-secondary rounded-3xl px-5 py-4 overflow-visible ${className} shadow-md`}
    >
      {/* Airline header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-primary font-urbanist-bold text-base">
          {airline}
        </Text>
        <Text className="text-primary/60 font-urbanist-medium text-xs">
          EFA12345
        </Text>
      </View>

      {/* Codes and times */}
      <View className="flex-row items-center justify-between mt-3">
        <View>
          <Text className="text-primary/70 font-urbanist-medium text-[11px]">
            12:30 AM
          </Text>
          <Text className="text-primary font-urbanist-bold text-3xl mt-1">
            {codeFrom}
          </Text>
        </View>
        <View className="items-center">
          <View className="w-10 h-10 rounded-full items-center justify-center border border-primary/20">
            <Ionicons
              name="airplane"
              size={18}
              color={COLORS.primary}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </View>
          <Text className="text-primary font-urbanist-medium text-[11px] mt-1">
            {dateLabel}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-primary/70 font-urbanist-medium text-[11px]">
            11:30 AM
          </Text>
          <Text className="text-primary font-urbanist-bold text-3xl mt-1">
            {codeTo}
          </Text>
        </View>
      </View>

      {/* Details grid */}
      <View className="mt-3">
        <View className="flex-row justify-between">
          <View>
            <Text className="text-primary/60 text-[11px] font-urbanist-medium">
              Passenger Name
            </Text>
            <Text className="text-primary font-urbanist-semibold">
              {passenger}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-primary/60 text-[11px] font-urbanist-medium">
              Seat
            </Text>
            <Text className="text-primary font-urbanist-semibold">{seat}</Text>
          </View>
        </View>
        <View className="flex-row justify-between mt-3">
          <View>
            <Text className="text-primary/60 text-[11px] font-urbanist-medium">
              Gate
            </Text>
            <Text className="text-primary font-urbanist-semibold">{gate}</Text>
          </View>
          <View className="items-end">
            <Text className="text-primary/60 text-[11px] font-urbanist-medium">
              Flight No
            </Text>
            <Text className="text-primary font-urbanist-semibold">
              {flightNo}
            </Text>
          </View>
        </View>
      </View>

      {/* Barcode */}
      <View className="mt-4 h-12 rounded-lg bg-primary/10 overflow-hidden">
        <View className="flex-row h-full items-end px-3">
          <View className="w-[2px] h-10 bg-primary mr-1" />
          <View className="w-[1px] h-full bg-primary mr-1" />
          <View className="w-[3px] h-11 bg-primary mr-1" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
          <View className="w-[2px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-7 bg-primary mr-1" />
          <View className="w-[2px] h-11 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[3px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
          <View className="w-[2px] h-10 bg-primary mr-1" />
          <View className="w-[1px] h-full bg-primary mr-1" />
          <View className="w-[3px] h-9 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[2px] h-11 bg-primary mr-1" />
          <View className="w-[1px] h-7 bg-primary mr-1" />
          <View className="w-[2px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-10 bg-primary mr-1" />
          <View className="w-[3px] h-11 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[2px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
          <View className="w-[2px] h-10 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[3px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
          <View className="w-[2px] h-11 bg-primary mr-1" />
          <View className="w-[1px] h-7 bg-primary mr-1" />
          <View className="w-[2px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-10 bg-primary mr-1" />
          <View className="w-[3px] h-11 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[2px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
          <View className="w-[2px] h-10 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[3px] h-full bg-primary" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
          <View className="w-[2px] h-10 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[3px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
          <View className="w-[2px] h-10 bg-primary mr-1" />
          <View className="w-[1px] h-8 bg-primary mr-1" />
          <View className="w-[3px] h-full bg-primary mr-1" />
          <View className="w-[1px] h-9 bg-primary mr-1" />
        </View>
      </View>
    </View>
  );
};

export default TicketPreview;
