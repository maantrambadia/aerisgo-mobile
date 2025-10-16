import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import Loader from "../components/Loader";
import BottomSheetModal from "../components/BottomSheetModal";
import { getDocuments, upsertDocument, deleteDocument } from "../lib/profile";
import { toast } from "../lib/toast";

export default function UserDocuments() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDocuments = async () => {
    try {
      const result = await getDocuments();
      setDocuments(result.documents || []);
    } catch (_error) {
      toast.error({
        title: "Error",
        message: "Failed to load documents",
      });
    } finally {
      setTimeout(() => setInitialLoading(false), 200);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [])
  );

  const openAddEdit = (type) => {
    const existing = documents.find((d) => d.documentType === type);
    setEditingType(type);
    setDocumentNumber(existing?.documentNumber || "");
    setShowModal(true);
  };

  // Validation functions
  const isValidAadhar = (v) => /^\d{12}$/.test(v);
  const isValidPassport = (v) => /^[A-Z][0-9]{7}$/.test(v);

  const handleSave = async () => {
    try {
      const docNum = documentNumber.trim().toUpperCase();

      if (!docNum) {
        toast.error({ title: "Error", message: "Document number is required" });
        return;
      }

      // Validate based on document type
      if (editingType === "aadhar") {
        if (!isValidAadhar(docNum)) {
          toast.error({
            title: "Invalid Aadhar",
            message: "Aadhar must be 12 digits",
          });
          return;
        }
      } else if (editingType === "passport") {
        if (!isValidPassport(docNum)) {
          toast.error({
            title: "Invalid Passport",
            message: "Passport format: 1 letter + 7 digits (e.g., A1234567)",
          });
          return;
        }
      }

      setSaving(true);
      await upsertDocument({
        documentType: editingType,
        documentNumber: docNum,
      });

      toast.success({
        title: "Success",
        message: "Document saved successfully",
      });
      setShowModal(false);
      loadDocuments();
    } catch (error) {
      toast.error({
        title: "Save Failed",
        message: error?.message || "Failed to save document",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteDocument(type);
      toast.success({
        title: "Success",
        message: "Document deleted successfully",
      });
      loadDocuments();
    } catch (error) {
      toast.error({
        title: "Delete Failed",
        message: error?.message || "Failed to delete document",
      });
    }
  };

  const getDocumentIcon = (type) => {
    if (type === "aadhar") return "card-outline";
    if (type === "passport") return "airplane-outline";
    return "document-outline";
  };

  const getDocumentLabel = (type) => {
    if (type === "aadhar") return "Aadhar Card";
    if (type === "passport") return "Passport";
    return type;
  };

  if (initialLoading) {
    return (
      <Loader message="Loading documents" subtitle="Fetching your documents" />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="px-6 pt-6 pb-4 bg-background flex-row items-center justify-between"
      >
        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
          onPress={async () => {
            try {
              await Haptics.selectionAsync();
            } catch {}
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#541424" />
        </TouchableOpacity>
        <Text className="text-primary font-urbanist-semibold text-lg">
          User Documents
        </Text>
        <View className="w-14 h-14" />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 mt-4">
          {
            <>
              {["aadhar", "passport"].map((type, idx) => {
                const doc = documents.find((d) => d.documentType === type);
                return (
                  <Animated.View
                    key={type}
                    entering={FadeInDown.duration(400)
                      .delay(100 + idx * 50)
                      .springify()}
                    className="mb-4"
                  >
                    <View className="bg-secondary/40 border border-primary/10 rounded-[28px] p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                            <Ionicons
                              name={getDocumentIcon(type)}
                              size={22}
                              color="#541424"
                            />
                          </View>
                          <View className="ml-4 flex-1">
                            <Text className="text-primary font-urbanist-semibold text-base">
                              {getDocumentLabel(type)}
                            </Text>
                            {doc ? (
                              <Text className="text-primary/60 font-urbanist text-sm mt-0.5">
                                {doc.documentNumber}
                              </Text>
                            ) : (
                              <Text className="text-primary/40 font-urbanist text-sm mt-0.5">
                                Not added
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => openAddEdit(type)}
                            className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"
                          >
                            <Ionicons
                              name={doc ? "create-outline" : "add"}
                              size={18}
                              color="#541424"
                            />
                          </TouchableOpacity>
                          {doc && (
                            <TouchableOpacity
                              onPress={() => handleDelete(type)}
                              className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color="#541424"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </>
          }
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <BottomSheetModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={editingType ? getDocumentLabel(editingType) : "Document"}
        scrollable={false}
        minHeight="40%"
        maxHeight="50%"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1">
            <FormInput
              label="Document Number"
              placeholder={
                editingType === "aadhar"
                  ? "12 digits"
                  : "1 letter + 7 digits (e.g., A1234567)"
              }
              value={documentNumber}
              onChangeText={(text) => {
                if (editingType === "aadhar") {
                  setDocumentNumber(text.replace(/[^0-9]/g, ""));
                } else {
                  setDocumentNumber(text.toUpperCase());
                }
              }}
              leftIconName="card-outline"
              keyboardType={editingType === "aadhar" ? "numeric" : "default"}
              maxLength={editingType === "aadhar" ? 12 : 8}
            />

            <View className="mt-4 mb-2">
              <PrimaryButton
                title={saving ? "Saving..." : "Save Document"}
                onPress={handleSave}
                disabled={saving}
                withHaptics
                hapticStyle="medium"
                className="w-full"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    </View>
  );
}
