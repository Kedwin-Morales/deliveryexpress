import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Orden } from "@/type";

export default function OrdenDetalle() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);
  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrden(res.data);
    } catch (err) {
      console.log("Error cargando orden:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Actualizar cada 30 s hasta que el estado sea “Entregada”
  useEffect(() => {
    fetchOrden();

    let interval: ReturnType<typeof setInterval>;

    if (orden?.estado_nombre !== "Entregada") {
      interval = setInterval(() => {
        fetchOrden();
      }, 30000);
    }

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, orden?.estado_nombre]);

  // 🚶‍♂️ Stepper
  const steps = ["Pendiente", "Aceptada", "En camino", "Entregada"];

  // 📍 Paso actual
  const currentStepIndex = steps.findIndex(
    (s) => s.toLowerCase() === orden?.estado_nombre?.toLowerCase()
  );

  // 🚫 Validar si el botón debe estar deshabilitado
  const isDisabled =
    orden?.estado_nombre === "Pendiente" ||
    orden?.estado_nombre === "Aceptada";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/profile')}
              className="mr-3 flex-row items-center"
            >
              <Ionicons name="arrow-back" size={22} color="#003399" />
              <Text className="text-xl font-bold text-primary ml-1">Atrás</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/profile")}
            className="items-center mr-4"
          >
            <Ionicons name="notifications" size={30} color="#FF6600" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text className="text-center mt-10 text-gray-500">
            Cargando pedido...
          </Text>
        ) : (
          <>
            {/* Encabezado */}
            <Text className="text-secondary text-center font-extrabold text-2xl">
              Pedido #{orden?.numero_orden}
            </Text>

            {/* Stepper */}
            <View className="mx-4 mt-6 mb-4">
              <View className="flex-row justify-between items-center relative">
                {steps.map((step, index) => {
                  const isActive = index <= currentStepIndex;

                  return (
                    <View key={index} className="items-center flex-1">
                      {/* Línea de conexión */}
                      {index > 0 && (
                        <View
                          className={`absolute left-0 right-0 top-4 h-1 ${
                            isActive ? "bg-secondary" : "bg-gray-300"
                          }`}
                        />
                      )}

                      {/* Círculo */}
                      <View
                        className={`z-10 w-8 h-8 rounded-full items-center justify-center ${
                          isActive ? "bg-secondary" : "bg-gray-300"
                        }`}
                      >
                        {isActive ? (
                          <Ionicons name="checkmark" size={20} color="white" />
                        ) : (
                          <Text className="text-white font-bold">
                            {index + 1}
                          </Text>
                        )}
                      </View>

                      {/* Etiqueta */}
                      <Text
                        className={`mt-2 text-center text-sm ${
                          isActive
                            ? "text-primary font-semibold"
                            : "text-gray-400"
                        }`}
                        numberOfLines={1}
                      >
                        {step}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Información del pedido */}
            <View className="mx-4 bg-gray-50 rounded-md elevation-md p-4 mt-3">
              <Text className="text-secondary font-semibold text-lg mb-2">
                Estado: {orden?.estado_nombre}
              </Text>
              <Text className="mb-1">Cliente: {orden?.cliente_nombre}</Text>
              <View>
                <Text className="font-medium">Dirección:</Text>
                <Text>{orden?.direccion_entrega}</Text>
              </View>

              <Text className="font-extrabold mt-3 text-primary text-lg">
                Total: {orden?.total}$
              </Text>
            </View>

            {/* Productos */}
            <View className="mt-4 mx-4">
              {orden?.detalles?.length ? (
                orden.detalles.map((item, index) => (
                  <View
                    key={index}
                    className="mb-3 p-4 flex-row justify-between items-center rounded-2xl bg-gray-50 elevation-sm"
                  >
                    <View className="flex-row gap-4">
                      <Image
                        source={{ uri: item.plato_imagen }}
                        className="h-24 w-24 rounded-xl"
                        resizeMode="cover"
                      />
                      <View className="justify-evenly">
                        <Text className="text-primary font-semibold">
                          {item.plato_nombre}
                        </Text>
                        <Text className="text-gray-500">
                          Cantidad: {item.cantidad}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 text-center mt-4">
                  Sin productos en la orden.
                </Text>
              )}
            </View>

            {/* Botón seguir ruta */}
            <TouchableOpacity
              disabled={isDisabled}
              onPress={() =>
                !isDisabled &&
                router.push({
                  pathname: "/perfil/mapa-direccion",
                  params: { id: orden?.id?.toString() },
                })
              }
              className={`mx-6 rounded-lg mt-8 py-3 flex-row justify-center items-center gap-2 mb-6 ${
                isDisabled ? "bg-gray-400" : "bg-primary"
              }`}
            >
              <FontAwesome name="map-marker" size={22} color="white" />
              <Text className="text-white font-bold text-lg">
                {isDisabled ? "Ruta no disponible" : "Seguir ruta"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
