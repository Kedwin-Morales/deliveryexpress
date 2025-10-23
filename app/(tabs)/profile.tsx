import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { Orden } from "@/type";
import { format } from "date-fns";
import { es } from "date-fns/locale";


const Profile = () => {
  const { user, logout } = useAuthStore();
  const [recentOrders, setRecentOrders] = useState<Orden[]>([]);

  const menuItems = [
    { label: "Direcciones", icon: "map-marker-alt", action: () => router.push("/perfil/direccion") },
    { label: "Historial de pedidos", icon: "clock", action: () => router.push("/perfil/historial") },
  ];

  const fetchRecentOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      console.log('ordenes: ', res.data);

      // 🔄 Ordenamos por fecha (más recientes primero)
      const sorted = res.data.sort(
        (a: Orden, b: Orden) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
      );

      setRecentOrders(sorted.slice(0, 3)); // solo 3 últimas
    } catch (err) {
      console.log("Error obteniendo órdenes:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecentOrders();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
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

      <ScrollView className="mb-28">
        {/* User Info */}
        <View className="bg-white p-4 rounded-2xl flex-row justify-between">
          <View className="items-center justify-center flex-row gap-2">
            {user?.foto_perfil ? (
              <Image source={{ uri: user?.foto_perfil }} className="w-24 h-24 rounded-full" />
            ) : (
              <Ionicons name="person" size={30} color="white" />
            )}

            <View>
              <Text className="text-lg font-bold mt-2">{user?.nombre || "Usuario"}</Text>
              <Text className="text-gray-500 text-base">{user?.email}</Text>
              <Text className="text-gray-500 text-base">{user?.telefono}</Text>
            </View>
          </View>



          <TouchableOpacity
            onPress={() => router.push("/perfil/formulario-perfil")}
            className="px-3 py-1 rounded-md flex-row gap-1 items-center"
          >
            <MaterialCommunityIcons name="pencil" size={24} color="#003399" />
          </TouchableOpacity>
        </View>

        <View className="px-4">
          <TouchableOpacity className="bg-secondary py-4 rounded-2xl flex-row justify-center gap-2">
            <AntDesign name="heart" size={24} color="white" />
            <Text className="text-white font-extrabold text-lg">Platos Favoritos</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View className="px-4 mt-2">
          <Text className="text-lg font-extrabold mb-3">Últimas Órdenes</Text>
          {recentOrders.length > 0 ? (
            <>
              <View className="bg-gray-100 rounded-2xl elevation-lg">
                {recentOrders.map((order) => (
                  <TouchableOpacity key={order.id} className="flex-row justify-between p-4" onPress={() => router.push({
                    pathname: "/perfil/orden-detalle",
                    params: { id: order.id.toString() },
                  })}>
                    <View>
                      <Text className="font-bold">Pedido #{order.numero_orden}</Text>
                      <Text className="text-sm text-gray-800"> {order.creado_en
                        ? format(new Date(order.creado_en), "dd/MM/yyyy HH:mm", { locale: es })
                        : "Sin fecha"}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-lg">${order.total}</Text>

                      
                      <Text className={`rounded-full ${
                      order.estado_nombre === "Entregada"
                        ? "text-green-600"
                        : order.estado_nombre === "En camino"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}>{order.estado_nombre}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View className="bg-white rounded-2xl shadow-md p-6 items-center">
              <Text className="text-gray-600 mb-3 text-lg">Aún no tienes ninguna orden</Text>
              <TouchableOpacity
                onPress={() => router.push("/search")}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold text-lg">Explorar restaurantes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>


        {/* Menu Options */}
        <View className="px-4 mt-6 gap-4 flex">
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={item.action}
              className="flex-row justify-between items-center p-4 bg-primary elevation-md rounded-2xl"
            >
              <View className="flex-row items-center flex-1">
                <FontAwesome5 name={item.icon as any} size={24} color="white" />
                <View className="ml-3 flex-1">
                  <Text className="font-extrabold text-lg text-white text-center">{item.label}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View className="px-4 mt-6">
          <View className="bg-white rounded-2xl elevation-md p-4 space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Versión</Text>
              <Text>1.0.0</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500">Centro de ayuda</Text>
              <Ionicons name="chevron-forward" size={18} color="gray" />
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500">Términos y condiciones</Text>
              <Ionicons name="chevron-forward" size={18} color="gray" />
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500">Política de privacidad</Text>
              <Ionicons name="chevron-forward" size={18} color="gray" />
            </View>
          </View>
        </View>

        {/* Logout */}
        <View className="px-4 mt-6 mb-6 justify-center items-center">
          <TouchableOpacity
            onPress={logout}
            className="bg-white rounded-2xl elevation-md py-4 flex-row justify-center items-center border border-secondary w-3/4"
          >
            <Ionicons name="log-out-outline" size={20} color="red" />
            <Text className="text-secondary font-bold ml-2 ">Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
