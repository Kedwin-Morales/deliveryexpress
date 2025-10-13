import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "@/constants";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";

export default function FormularioPerfil() {
  const router = useRouter();
  const { user, login } = useAuthStore();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<ImagePickerAsset | null>(null);
  const [fotoRemota, setFotoRemota] = useState<string>(""); // Para mostrar la que viene de la API
  const [email, setEmail] = useState("");

  // 🔹 Cargar datos del usuario al entrar
  useFocusEffect(
    useCallback(() => {
      const fetchUsuario = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/user/usuario/`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          });

          const u = res.data[0];
          setNombre(u.nombre);
          setTelefono(u.telefono);
          setEmail(u.email);
          setFotoRemota(u.foto_perfil || "");
        } catch (error) {
          console.error("Error al cargar perfil:", error);
        }
      };
      fetchUsuario();
    }, [user?.token])
  );

  // 📸 Seleccionar foto de perfil
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFotoPerfil(result.assets[0]);
    }
  };

  // 📌 Guardar cambios
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("telefono", telefono);

    if (fotoPerfil) {
      formData.append("foto_perfil", {
        uri: fotoPerfil.uri,
        type: "image/jpeg",
        name: "perfil.jpg",
      } as any);
    }

    try {
      const res = await axios.patch(`${API_URL}/api/user/usuario/${user?.id}/`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = res.data;

      // 🔹 refrescamos el estado sin perder el token
      login({
        ...user!, // conservamos token y demás campos
        nombre: updatedUser.nombre,
        telefono: updatedUser.telefono,
        foto_perfil: updatedUser.foto_perfil,
      });

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      router.back();
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error.response?.data || error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} className="mr-3 flex-row items-center">
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary">Atrás</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>

      <ScrollView className="px-4 mt-2">
        {/* Foto de perfil */}
        <View className="items-center mb-6 px-4 justify-around">
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil.uri }} className="w-24 h-24 rounded-full" />
          ) : fotoRemota ? (
            <Image source={{ uri: fotoRemota }} className="w-24 h-24 rounded-full" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              <Ionicons name="person" size={40} color="white" />
            </View>
          )}

          <TouchableOpacity
            className="mt-2 bg-gray-200 px-4 py-2 rounded-lg flex-row items-center gap-2"
            onPress={pickImage}
          >
            <Entypo name="camera" size={24} color="black" />
            <Text className="font-extrabold">Cambiar foto</Text>
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <Text className="font-bold mb-1">Nombre</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-4 mb-4 "
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre"
        />

        {/* Email */}
        <Text className="font-semibold mb-1">Correo electrónico</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
          value={email}
          placeholder="Correo electrónico"
          editable={false}
        />

        {/* Teléfono */}
        <Text className="font-semibold mb-1">Teléfono</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-4 mb-4 "
          value={telefono}
          onChangeText={setTelefono}
          placeholder="Tu número de teléfono"
          keyboardType="phone-pad"
        />

        {/* Botones */}
        <View className="gap-4 justify-center items-center">
          <TouchableOpacity
            className="bg-secondary rounded-lg py-3 px-4 flex-row items-center gap-2 justify-center w-1/2"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center font-extrabold ">Guardar cambios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/profile")}
          >
            <Text className="text-primary text-center font-extrabold">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
