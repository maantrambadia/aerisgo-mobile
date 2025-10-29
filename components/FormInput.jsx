import { useState } from "react";
import { TextInput, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const FormInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoComplete,
  className = "",
  error = "",
  onFocus,
  returnKeyType,
  onSubmitEditing,
  prefix,
  maxLength,
}) => {
  const [hidden, setHidden] = useState(secureTextEntry);
  const handleFocus = async (e) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    onFocus && onFocus(e);
  };

  return (
    <View className={`w-full ${className}`}>
      {label ? (
        <Text className="text-primary font-urbanist-semibold mb-2">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center rounded-2xl px-4 py-3 border ${
          error
            ? "border-red-400 bg-secondary"
            : "bg-secondary border-primary/20"
        }`}
      >
        {prefix ? (
          <Text
            accessibilityElementsHidden
            className="text-primary font-urbanist mr-2"
          >
            {prefix}
          </Text>
        ) : null}
        <TextInput
          className="flex-1 text-primary font-urbanist"
          placeholder={placeholder}
          placeholderTextColor="#54142499"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          onFocus={handleFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
        />
        {error ? (
          <Ionicons
            name="alert-circle"
            size={18}
            color="#b91c1c"
            style={{ marginLeft: 8 }}
          />
        ) : null}
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
              setHidden((s) => !s);
            }}
          >
            <Ionicons
              name={hidden ? "eye-off" : "eye"}
              size={20}
              color={error ? "#b91c1c" : "#541424"}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View className="flex-row items-center mt-1">
          <Ionicons name="alert-circle" size={14} color="#ef4444" />
          <Text className="text-red-500 ml-1 font-urbanist-medium text-[12px]">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default FormInput;
