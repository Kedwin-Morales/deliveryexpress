import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import axios from "axios";
import { API_URL, images } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Direccion } from "@/type";

export default function DireccionLista() {
  const token = useAuthStore((state) => state.user?.token);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);

  const fetchDirecciones = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDirecciones(res.data);
    } catch (err) {
      console.log("Error obteniendo direcciones:", err);
    }
  };

  const marcarPrincipal = async (id: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/user/direcciones/${id}/`,
        { es_predeterminada: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 🔄 Refrescamos lista después de actualizar
      fetchDirecciones();
    } catch (error) {
      console.error("Error al marcar principal:", error);
      Alert.alert("Error", "No se pudo marcar esta dirección como principal.");
    }
  };

  const eliminarDireccion = (id: string) => {
    Alert.alert(
      "Eliminar dirección",
      "¿Seguro que quieres eliminar esta dirección?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/user/direcciones/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setDirecciones((prev) => prev.filter((d) => d.id !== id));
            } catch (error) {
              console.error("Error eliminando dirección:", error);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchDirecciones();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} className="mr-3 flex-row">
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary">Atrás</Text>
          </TouchableOpacity>
          
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>

      <Image source={images.papa_mapa} className="h-56 w-56 self-center" resizeMode="contain" />

      <Text className="text-center text-secondary font-extrabold text-3xl">Mis Direcciones</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 mt-4 gap-4">
          {direcciones.map((dir) => (
            <View
              key={dir.id}
              className={`p-4 flex-row justify-between items-center rounded-xl elevation-md ${dir.es_predeterminada ? 'bg-primary' : 'bg-gray-100'}`}
            >

              <TouchableOpacity
                onPress={() => marcarPrincipal(dir.id)}
                className="mt-2 flex-row items-center"
              >
                <Ionicons
                  name={dir.es_predeterminada ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={dir.es_predeterminada ? "white" : "gray"}
                />
              </TouchableOpacity>
              <View className="flex-1 pr-3 ml-2">
                <Text className={`font-bold text-lg ${dir.es_predeterminada ? 'text-white' : 'text-gray-800'}`}>{dir.nombre}</Text>
                <Text className={`${dir.es_predeterminada ? 'text-white' : 'text-gray-800'}`}>{dir.direccion_texto}</Text>
              </View>

              {/* Botones de acción */}
              <View className="flex-row gap-2">
                {/* Eliminar */}
                <TouchableOpacity
                  onPress={() => eliminarDireccion(dir.id)}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" size={20} color={dir.es_predeterminada ? "white" : "gray"} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <View className="px-6 items-center gap-4 mt-8">
          <TouchableOpacity
            onPress={() => router.push("/perfil/formulario-direccion")}
            className="bg-secondary rounded-xl py-4 items-center elevation-md w-3/4"
          >
            <Text className="text-white font-bold text-lg">Añadir Dirección</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const principal = direcciones.find((d) => d.es_predeterminada);
              if (principal) {
                router.push({
                  pathname: "/perfil/formulario-direccion",
                  params: {
                    id: principal.id.toString(),
                    nombre: principal.nombre,
                    direccion_texto: principal.direccion_texto,
                    latitud: principal.latitud?.toString(),
                    longitud: principal.longitud?.toString(),
                  },
                });
              }
            }}
            className="items-center w-3/4 flex-row gap-2 justify-center"
          >
            <Text className="text-primary font-bold text-lg">Editar Dirección</Text>
            <MaterialCommunityIcons name="pencil" size={24} color="#003399" />
          </TouchableOpacity>

        </View>
      </ScrollView>


    </SafeAreaView>
  );
}
