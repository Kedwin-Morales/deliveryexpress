import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View, Image, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import axios from "axios";
import { API_URL, images } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Plato, Restaurante } from "@/type";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";
import CarritoFlotante from "@/components/FloatingCart";
import { useCarrito } from "@/store/useCart";

const RestaurantePlatos = () => {
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);
  const { carrito, agregarAlCarrito, quitarDelCarrito } = useCarrito();

  const [platos, setPlatos] = useState<Plato[]>([]);
  const [restaurante, setRestaurante] = useState<Restaurante>();
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchPlatos = async () => {
    try {
      const resPlatos = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${id}/platos/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlatos(resPlatos.data);

      const res = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurante(res.data);

      console.log(res.data)
    } catch (err) {
      console.log("Error obteniendo platos:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlatos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Imagen y header */}
        <View className="flex-row items-center px-4 py-3 bg-white justify-between ">
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

        <Image
          source={restaurante?.imagen_url ? { uri: restaurante.imagen_url } : images.avatar}
          className="h-80 mx-4 rounded-t-2xl"
          resizeMode="contain"
        />

        {/* Info del restaurante */}
        <View className="mt-2 p-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-extrabold mb-2">{restaurante?.nombre}</Text>
            <View className="flex-row items-center gap-1">
              <Text className="ml-1 text-xl font-bold">
                {restaurante?.calificacion_promedio ?? "0.0"}
              </Text>
              <FontAwesome name="star" size={24} color="#FF6600" />
            </View>
          </View>

          <View className="flex-row gap-4 justify-between items-center">
            <View className="flex-row gap-1 items-center w-2/3">
              <FontAwesome name="map-marker" size={24} color="#FF6600" />
              <Text className="text-sm">{restaurante?.direccion}</Text>
            </View>

            <View className="flex-row items-center">
              <Feather name="clock" size={16} color="#FF6600" />
              <Text className="ml-1 text-sm font-semibold">30-40 min</Text>
            </View>
          </View>

          <Text className="text-base mt-2">{restaurante?.descripcion}</Text>
        </View>

        {loading ? (
          <Text className="text-center text-gray-500">Cargando...</Text>
        ) : platos.length === 0 ? (
          <Text className="text-center text-gray-500">No hay platos disponibles</Text>
        ) : (
          <View className="gap-4 px-4">
            {platos.map((p) => {
              return (
                <View
                  key={p.id}
                  className="bg-gray-100 rounded-2xl p-4 elevation-md overflow-hidden flex-row"
                >
                  <Image
                    source={p.imagen ? { uri: p.imagen } : images.avatar}
                    className="w-2/5 rounded-2xl"
                    resizeMode="cover"
                  />
                  <View className="p-4 w-2/3">
                    <Text className="text-base font-extrabold text-gray-800 mb-1">{p.nombre}</Text>
                    <Text className="text-sm text-gray-600 mb-2">{p.descripcion}</Text>
                    <View className="flex-row justify-between items-center">
                      {p.precio_descuento ? (
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base font-bold text-primary">
                            ${p.precio_descuento}
                          </Text>
                          <Text className="text-sm text-gray-400 line-through">
                            ${p.precio}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-base font-bold text-primary">
                          ${p.precio}
                        </Text>
                      )}

                      {/* Si no hay en carrito -> botón agregar */}
                      {carrito.find((c) => c.id === p.id.toString()) ? (
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity
                            onPress={() => {
                              agregarAlCarrito({
                                id: p.id.toString(),
                                nombre: p.nombre,
                                precio: p.precio,
                                imagen: p.imagen,
                                nombre_restaurante: restaurante?.nombre || "",
                                descripcion : p.descripcion,
                                precio_descuento: p.precio_descuento
                              })
                            }
                            }
                            className="border border-primary px-3 py-1 rounded-full"
                          >
                            <Text className="text-lg font-bold text-primary">+</Text>
                          </TouchableOpacity>

                          <Text className="text-base font-bold">
                            {carrito.find((c) => c.id === p.id.toString())?.cantidad}
                          </Text>

                          <TouchableOpacity
                            onPress={() => quitarDelCarrito(p.id.toString())}
                            className="px-3 py-1 rounded-full border border-primary"
                          >
                            <Text className="text-lg font-bold text-primary">-</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() =>
                            agregarAlCarrito({
                              id: p.id.toString(),
                              nombre: p.nombre,
                              precio: p.precio,
                              imagen: p.imagen,
                              nombre_restaurante: restaurante?.nombre || "",
                              precio_descuento: p.precio_descuento,
                              descripcion: p.descripcion
                            })
                          }
                          className="bg-primary px-3 py-1 rounded-full"
                        >
                          <Text className="text-white">Añadir</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CarritoFlotante
        totalItems={carrito.reduce((acc, i) => acc + i.cantidad, 0)}
        onPress={() => router.push("/cart")}
      />


    </SafeAreaView>
  );
};

export default RestaurantePlatos;
