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
  autoComplete = "off",
  className = "",
  error = "",
  onFocus,
  returnKeyType,
  onSubmitEditing,
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

      <View className="flex-row items-center bg-secondary rounded-2xl px-4 py-3 border border-primary/20">
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
        />
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
              color="#541424"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text className="text-red-600 mt-2 font-urbanist-medium">{error}</Text>
      ) : null}
    </View>
  );
};

export default FormInput;
