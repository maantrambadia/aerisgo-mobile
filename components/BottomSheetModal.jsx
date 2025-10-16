import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

/**
 * Reusable Bottom Sheet Modal Component
 *
 * Provides a consistent bottom sheet design across the app with:
 * - BlurView backdrop
 * - Rounded top corners (32px)
 * - Header with title and close button
 * - Scrollable content area
 * - Haptic feedback
 * - Spring animation
 *
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal header title
 * @param {React.ReactNode} children - Modal content
 * @param {string} maxHeight - Maximum height (default: "85%")
 * @param {string} minHeight - Minimum height (default: "50%")
 * @param {boolean} showCloseButton - Show close button in header (default: true)
 * @param {React.ReactNode} headerRight - Optional custom header right content
 * @param {boolean} scrollable - Enable scrolling (default: true)
 * @param {boolean} keyboardAware - Enable keyboard avoiding behavior (default: false)
 */
export default function BottomSheetModal({
  visible,
  onClose,
  title = "Details",
  children,
  maxHeight = "85%",
  minHeight = "50%",
  showCloseButton = true,
  headerRight = null,
  scrollable = true,
  keyboardAware = false,
}) {
  const handleClose = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    onClose && onClose();
  };

  const ContentWrapper = keyboardAware ? KeyboardAvoidingView : View;
  const keyboardProps = keyboardAware
    ? {
        behavior: Platform.OS === "ios" ? "padding" : "height",
        keyboardVerticalOffset: Platform.OS === "ios" ? 0 : 20,
      }
    : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView intensity={40} tint="dark" className="flex-1 justify-end">
        <ContentWrapper {...keyboardProps} className="flex-1 justify-end">
          <Animated.View
            entering={FadeInUp.duration(400).springify()}
            className="bg-background rounded-t-[32px] overflow-hidden z-10"
            style={{ maxHeight, minHeight }}
          >
            {/* Header */}
            <View className="px-6 py-5 border-b border-primary/10">
              <View className="flex-row items-center justify-between">
                <Text className="text-primary font-urbanist-bold text-xl flex-1">
                  {title}
                </Text>
                {headerRight}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={handleClose}
                    className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                  >
                    <Ionicons name="close" size={22} color="#541424" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Content */}
            {scrollable ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <View className="px-6 py-6">{children}</View>
              </ScrollView>
            ) : (
              <View className="px-6 py-6 flex-1">{children}</View>
            )}
          </Animated.View>
        </ContentWrapper>
      </BlurView>
    </Modal>
  );
}
