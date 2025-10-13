import { View, Text, Image, TouchableOpacity, Alert, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Orden } from "@/type";

export default function DeliveryHome() {
  const { user, logout } = useAuthStore();
  const [disponible, setDisponible] = useState<boolean>(false);
  const [ordenActual, setOrdenActual] = useState<Orden | null>(null);
  const [ordenesAsignadas, setOrdenesAsignadas] = useState<Orden[]>([]);
  const [contador, setContador] = useState(30);
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();

  // 🚀 Obtener estado actual
  const fetchDisponibilidad = () => {
    axios
      .get(`${API_URL}/api/user/conductor/mi_estado/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => setDisponible(res.data.disponible))
      .catch((err) => console.log("Error cargando estado:", err));
  };

  const toggleDisponibilidad = async () => {
    try {
      const nuevoEstado = !disponible;
      setDisponible(nuevoEstado);

      console.log(nuevoEstado)

      console.log(user?.token)
      await axios.patch(
        `${API_URL}/api/user/conductor/mi_estado/`,
        { disponible: nuevoEstado },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      Alert.alert(
        "Estado actualizado",
        nuevoEstado ? "Ahora estás disponible 🚴‍♂️" : "Te marcaste como inactivo ❌"
      );
    } catch (err) {
      console.log("Error actualizando disponibilidad:", err);
      setDisponible(!disponible); // rollback
    }
  };

  // 🚚 Órdenes esperando aceptación
  const fetchOrdenesPorAceptar = () => {
    axios
      .get(`${API_URL}/api/ordenes/ordenes/esperando-aceptacion/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => {
        if (res.data.length > 0) {
          const nuevaOrden = res.data[0];
          setOrdenActual(nuevaOrden);
          setShowModal(true);
          setContador(30); // reinicia el contador
        }
      })
      .catch((err) => console.log("Error cargando ordenes:", err));
  };

  // 🚚 Órdenes asignadas al conductor
  const fetchOrdenesAsignadas = () => {
    axios
      .get(`${API_URL}/api/ordenes/ordenes/mis-ordenes/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => {
        setOrdenesAsignadas(res.data);
      })
      .catch((err) => console.log("Error cargando ordenes asignadas:", err));
  };

  // 🎯 Aceptar / rechazar orden
  const aceptarOrden = async () => {
    if (!ordenActual) return;
    try {
      await axios.post(
        `${API_URL}/api/ordenes/ordenes/${ordenActual.id}/aceptar/`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      Alert.alert("✅ Orden aceptada");
      fetchOrdenesAsignadas();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      Alert.alert("Error", "No se pudo aceptar la orden.");
    }
    setShowModal(false);
    setOrdenActual(null);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDisponibilidad();
      fetchOrdenesAsignadas();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // 📍 Enviar ubicación y consultar órdenes cada 30s
  useEffect(() => {
    let locationInterval: ReturnType<typeof setInterval>;
    let ordenesInterval: ReturnType<typeof setInterval>;
    let timerInterval: ReturnType<typeof setInterval>;

    const startSendingLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se puede acceder a la ubicación.");
        return;
      }

      // ⏱️ Intervalo para enviar ubicación cada 30 seg
      locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          await axios.patch(
            `${API_URL}/api/user/conductor/mi_estado/`,
            {
              latitud: location.coords.latitude,
              longitud: location.coords.longitude,
            },
            { headers: { Authorization: `Bearer ${user?.token}` } }
          );

          console.log("📍 Ubicación enviada:", location.coords);
        } catch (err) {
          console.log("Error enviando ubicación:", err);
        }
      }, 30000);
    };

    if (disponible) {
      startSendingLocation();

      // 🚚 Consultar órdenes cada 30 seg
      fetchOrdenesPorAceptar(); // primera consulta inmediata
      ordenesInterval = setInterval(() => {
        fetchOrdenesPorAceptar();
      }, 30000);
    }

    // ⏱️ Timer para el popup (30s)
    if (showModal && contador > 0) {
      timerInterval = setInterval(() => {
        setContador((prev) => prev - 1);
      }, 1000);
    }

    // ❌ Limpieza
    return () => {
      if (locationInterval) clearInterval(locationInterval);
      if (ordenesInterval) clearInterval(ordenesInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponible, showModal]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}


      <View className="flex-row justify-end items-center bg-white rounded-2xl px-4 py-3 mb-2 mt-2 mx-4">
        <TouchableOpacity onPress={() => router.push("/profile")} className="items-center">
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-4 mx-4 bg-gray-100 rounded-xl p-4">
        <Image source={{uri: user?.foto_perfil || user?.foto_perfil_url}} className="w-24 h-24 rounded-full" />
        <View className="justify-between">
          <View className="">
            <Text className="font-bold text-lg">{user?.nombre}</Text>
            <Text className={`font-bold ${disponible ? 'text-green-600' : 'text-red-500' }`}>Estado: {disponible ? 'Disponible' : 'No disponible'}</Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity className="bg-secondary px-2 py-1 rounded-full"  onPress={toggleDisponibilidad}>
              <Text className="font-bold text-white">{disponible ? 'Desactivarme' : 'Activarme'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={logout}>
              <Text className="font-bold text-primary">
                Cerrar sesión
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>

      {/* Lista de órdenes asignadas */}
      <ScrollView className="px-6">
        <Text className="text-xl font-bold mt-4 text-center text-secondary">Órdenes asignadas</Text>
        {ordenesAsignadas.length === 0 ? (
          <Text className="text-gray-500 mt-2 text-center">No tienes órdenes asignadas.</Text>
        ) : (
          ordenesAsignadas.map((orden) => (
            <TouchableOpacity
              key={orden.id}
              className="bg-gray-100 rounded-xl p-4 mt-3 elevation-md flex-row justify-between"
              onPress={() =>
                router.push({
                  pathname: "/(delivery)/orden/orden-detalle",
                  params: { id: orden.id },
                })
              }
            > 
            <View>
              <Text className="font-bold text-lg text-secondary">Pedido #{orden.numero_orden}</Text>
              <Text>{new Date(orden.creado_en).toLocaleDateString()}</Text>
            </View>
            <View>
              <Text className="text-primary text-lg font-bold">${orden.total}</Text>
              <Text className="text-sm font-medium">Ver detalles</Text>
            </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Popup orden */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-5/6">
            {ordenActual && (
              <>
                <Text className="text-lg font-bold mb-2">🚨 Nueva Orden</Text>
                <Text className="text-gray-700 mb-2">Cliente: {ordenActual.cliente_nombre}</Text>
                <Text className="text-red-600 font-bold mb-4">
                  Tiempo restante: {contador}s
                </Text>
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="bg-red-500 py-2 px-4 rounded-lg"
                    onPress={() => {
                      setShowModal(false);
                      setOrdenActual(null);
                    }}
                  >
                    <Text className="text-white font-bold">Rechazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={aceptarOrden}
                    className="bg-green-600 py-2 px-4 rounded-lg"
                  >
                    <Text className="text-white font-bold">Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
