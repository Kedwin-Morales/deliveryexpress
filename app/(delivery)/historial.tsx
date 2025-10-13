import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Historial() {
  const { user } = useAuthStore();
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const router = useRouter();

  const fetchOrdenes = async () => {
    try {
      const resp = await axios.get(
        `${API_URL}/api/ordenes/ordenes/mis-ordenes/`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setOrdenes(resp.data);

      console.log(ordenes)

    } catch (err) {
      console.error("Error al obtener órdenes:", err);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Función para asignar color según el estado
  const colorEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pago por verificar':
        return '#FBC02D';

      case 'pendiente':
        return '#9E9E9E';

      case 'aceptada':
        return '#0033A0';

      case 'asignada':
        return '#FF9800';

      case 'en camino':
        return '#009688';

      case 'entregada':
        return '#4CAF50'; // verde

      case 'cancelada':
        return '#F44336'; // rojo
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 flex-row">
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary">Atrás</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView className="px-6 mt-4">
        <Text className="text-center font-extrabold text-secondary text-xl mb-4">
          Historial de Órdenes
        </Text>

        {ordenes.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10 font-bold">No tienes órdenes aún.</Text>
        ) : (
          ordenes.map((orden) => (
            <TouchableOpacity
              key={orden.id}
              className="bg-gray-100 rounded-2xl p-4 mb-4 flex-row gap-2 elevation-md"
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: `/(delivery)/orden/orden-detalle`, params: {id: orden.id} })}
            >
              <View>
                <Text className="text-lg text-center font-bold text-secondary">
                  Pedido #{orden.numero_orden}
                </Text>

                <Image source={{ uri: orden.restaurante_imagen }} className="w-28 h-28 rounded-full" />
              </View>

              <View className="justify-center">
                <Text className="text-sm font-bold">{orden.cliente_nombre}</Text>
                <Text className="text-sm">{new Date(orden.creado_en).toLocaleDateString()}</Text>
                <Text className="text-sm">{orden.direccion_entrega}</Text>
                <Text style={{color: colorEstado(orden.estado_nombre || '')}}>
                  {orden.estado_nombre}
                </Text>
              </View>

              <View className="justify-between">
                <Text className="text-gray-700 text-sm">Ver detalles</Text>
                <Text className="text-primary text-xl font-bold">${orden.total}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
