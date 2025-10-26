import { View, ActivityIndicator } from "react-native";

interface InlineLoaderProps {
  size?: "small" | "large" | number;
  color?: string;
}

export default function InlineLoader({ size = "small", color = "#FF6900" }: InlineLoaderProps) {
  return (
    <View style={{ paddingVertical: 4, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
