import { View, Text, Dimensions, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { API_URL, images } from "@/constants";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import PopupMessage from "@/components/PopupMessage";
import ScreenLoading from "@/components/ScreenLoading";

export default function FotoPerfil() {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const token = user?.token;

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (
    message: string,
    icon: keyof typeof MaterialIcons.glyphMap = "info"
  ) => {
    setPopup({ visible: true, message, icon });
  };

  const tomarFoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setArchivo(uri);
  };

  const submit = async () => {
    if (!archivo) return;

    const formData = new FormData();
    formData.append("foto_perfil", {
      uri: archivo,
      type: "image/jpeg",
      name: "selfie.jpg",
    } as any);

    try {
      setIsLoading(true); // Solo mostrar pantalla de carga

      const res = await axios.patch(
        `${API_URL}/api/user/usuario/${user?.$id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res.data)

      setIsLoading(false);

      if (res.data.verificacion_identidad) {
        showPopup("Documento validado exitosamente ", "check-circle");
        setTimeout(() => {
          router.push("/registros/confirmacion-registro");
        }, 2000);
      } else {
        showPopup("No se pudo validar la selfie ❌", "cancel");
        setTimeout(() => {
          router.replace("/registros/foto-perfil");
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Error al subir la foto:", error);
      setIsLoading(false);
      showPopup("Hubo un problema al enviar la foto", "cancel");
      setTimeout(() => {
        router.replace("/registros/foto-perfil");
      }, 2000);
    }
  };

  // 🔹 Render principal
  if (isLoading) {
    return <ScreenLoading />; // Solo mostrar pantalla de carga
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        className="w-full relative"
        style={{ height: Dimensions.get("screen").height / 14 }}
      >
        <View className="absolute top-8 left-5 z-10 flex-row items-center">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push("/registros/confirmacion-cedula")}
          >
            <Image
              source={images.arrowBack}
              style={{ tintColor: "#003399", width: 20, height: 20 }}
            />
            <Text className="text-xl text-primary ml-2 font-bold">Atrás</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-center font-bold text-3xl text-secondary mt-6">
        ¡Una última cosa!
      </Text>
      <Text className="font-semibold text-xl mt-3 w-3/5 self-center text-center">
        Queremos verificar que seas tú... ¡así que tómate tu mejor selfie!
      </Text>

      <View className="justify-center items-center px-4 mt-4">
        {archivo ? (
          <Image
            source={{ uri: archivo }}
            className="w-64 h-64 rounded-2xl"
            resizeMode="cover"
          />
        ) : (
          <Image
            source={images.hamburguesa_detective}
            className="w-64 h-64"
            resizeMode="contain"
          />
        )}
      </View>

      <TouchableOpacity
        className="mt-8 bg-primary w-3/5 rounded-xl self-center items-center p-4 gap-2"
        onPress={tomarFoto}
      >
        <FontAwesome6 name="camera" size={72} color="white" />
        <Text className="text-white font-bold text-xl">Toma una selfie</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`mt-8 rounded-xl self-center items-center p-4 ${
          archivo ? "bg-secondary" : "bg-gray-400"
        }`}
        onPress={submit}
        disabled={!archivo}
      >
        <Text className="text-white font-bold text-xl">Enviar foto</Text>
      </TouchableOpacity>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
