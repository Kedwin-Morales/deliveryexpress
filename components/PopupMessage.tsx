import React, { useEffect } from "react";
import { Modal, View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  message: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onClose: () => void;
};

const PopupMessage = ({ visible, message, icon, onClose }: Props) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000); // se cierra solo
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="bg-blue-600 rounded-2xl px-6 py-4 items-center h-1/4 justify-center">
          <MaterialIcons name={icon} size={72} color="orange" />
          <Text className="text-white text-base font-bold ml-3">{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default PopupMessage;
