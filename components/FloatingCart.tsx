import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  totalItems: number;
  onPress: () => void;
}

const FloatingCart = ({ totalItems, onPress }: Props) => {
  if (totalItems === 0) return null; // 👈 no mostrar si está vacío

  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-36 right-6 bg-secondary w-14 h-14 rounded-full items-center justify-center elevation-lg"
      activeOpacity={0.9}
    >
      {/* Ícono del carrito */}
      <Ionicons name="cart" size={28} color="white" />

      {/* Badge con número */}
      <View className="absolute -top-1 -right-1 bg-white rounded-full px-2 py-0.5 border border-secondary">
        <Text className="text-secondary font-bold text-xs">{totalItems}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default FloatingCart;
