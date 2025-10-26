import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Orden } from "@/type";

export default function HistorialOrdenes() {
  const token = useAuthStore((state) => state.user?.token);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true); // comenzamos en true para mostrar loader inicial

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdenes(res.data);
    } catch (err) {
      console.log("Error obteniendo órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

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

      {/* Contenido */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-2 text-gray-600">Cargando órdenes...</Text>
        </View>
      ) : ordenes.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="file-tray-outline" size={40} color="gray" />
          <Text className="text-gray-600 mt-2">No tienes órdenes aún</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          <Text className="text-secondary text-center font-extrabold text-2xl mt-4">
            Historial de Órdenes
          </Text>
          <View className="px-4 mt-4 gap-4">
            {ordenes.map((orden) => (
              <TouchableOpacity
                key={orden.id}
                onPress={() =>
                  router.push({
                    pathname: "/perfil/orden-detalle",
                    params: { id: orden.id.toString() },
                  })
                }
                className="bg-gray-100 rounded-2xl elevation-md px-4 py-3 flex-row justify-between"
              >
                <View>
                  <Text className="font-bold">{orden.restaurante_nombre}</Text>
                  <Text className="text-gray-600 text-sm">
                    Fecha: {new Date(orden.creado_en).toLocaleDateString()}
                  </Text>
                </View>

                <View className="justify-center items-center">
                  <Text className="text-gray-800 font-bold mt-1">${orden.total}</Text>
                  <Text
                    className={`text-sm rounded-full ${
                      orden.estado_nombre === "Entregada"
                        ? "text-green-600"
                        : orden.estado_nombre === "En camino"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {orden.estado_nombre}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
