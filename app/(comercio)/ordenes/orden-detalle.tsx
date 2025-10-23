import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Estado, Orden } from '@/type';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from "expo-clipboard";

export default function OrdenDetalle() {
  const { id } = useLocalSearchParams(); // id de la orden desde la ruta
  const token = useAuthStore((state) => state.user?.token);
  const router = useRouter();

  const [orden, setOrden] = useState<Orden>();
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState<Estado>()
  const [modalVisible, setModalVisible] = useState(false); // 👈 Estado del modal

  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrden(res.data);


      console.log('orden:', res.data)
    } catch (err) {
      console.log('Error obteniendo la orden:', err);
    }
  };

  const fecthEstatusOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstado(res.data.find((e: Estado) => e.nombre.toLowerCase() === "aceptada"));
    } catch (err) {
      console.log("Error obteniendo métodos de pago:", err);
    }
  };

  useEffect(() => {
    fetchOrden();
    fecthEstatusOrden();

    // ⏱️ Intervalo para refrescar estado de la orden cada 30s
    const interval = setInterval(() => {
      fetchOrden();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cambiar el estado de la orden
  const cambiarEstado = async (nuevoEstado: string) => {
    if (!orden) return;

    setLoading(true);
    try {
      await axios.patch(`${API_URL}/api/ordenes/ordenes/${id}/cambiar-estado/`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', `Orden actualizada a Esperando aceptacion`);
      fetchOrden(); // refrescar datos
    } catch (err: any) {
      console.log('Error al actualizar la orden:', err?.response?.data);
      Alert.alert('Error', 'No se pudo actualizar la orden');
    } finally {
      setLoading(false);
    }
  };

  // Color según estado
  const colorEstado = (estado?: string) => {
    switch (estado?.toLowerCase()) {
      case 'pago por verificar':
        return '#FBC02D'; // azul

      case 'pendiente':
        return '#9E9E9E'; // amarillo

      case 'aceptada':
        return '#0033A0';

      case 'asignada':
        return '#FF9800';

      case 'en camino':
        return '#009688'; // naranja

      case 'entregada':
        return '#4CAF50'; // verde

      case 'cancelada':
        return '#F44336'; // rojo
    }
  };

  if (!orden) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text>Cargando orden...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Botón volver */}
      <View className="flex-row items-center px-4 py-3 bg-white justify-between ">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.replace('/(comercio)/ordenes')} className="mr-3 flex-row">
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary">Atrás</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom:100 }}>

        <Text className='text-center font-bold text-2xl text-secondary mb-6'>Detalle de Orden</Text>

        <View className='elevation-md rounded-xl py-4 px-6 bg-gray-50'>
          <View className='flex-row justify-between'>
            <Text className="text-xl font-bold text-secondary">Pedido #{orden.numero_orden}</Text>
            <Text className="text-xl font-bold text-primary">${orden.total ?? 0}</Text>
          </View>
          <Text className="text-gray-600 font-medium">{new Date(orden.creado_en).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}</Text>


          <Text className="font-semibold mt-4" style={{ color: colorEstado(orden.estado_nombre) }}>
            Estado: {orden.estado_nombre}
          </Text>

        </View>

        <Text className='text-xl font-bold mt-6 text-secondary'>Platos de la Orden</Text>
        <View className='mt-2'>

          {/* Aquí puedes listar productos si tu orden tiene items */}
          {orden.detalles?.map((item, index) => (
            <View key={index} className="mb-2 p-4 justify-between items-center flex-row elevation-md rounded-2xl bg-gray-50 ">

              <View className='flex-row gap-4'>
                <Image source={{ uri: `${item.plato_imagen}` }}
                  className="h-28 w-28 rounded-xl"
                  resizeMode="cover" />
                <View className='justify-evenly'>
                  <Text className="text-primary font-medium">{item.plato_nombre}</Text>
                  <Text className="text-gray-500">Cantidad: {item.cantidad}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text className='text-xl font-bold mt-6 text-secondary'>Direccion de envío</Text>

        <View className='elevation-md rounded-2xl p-4 px-6 bg-gray-50 mt-6'>
          <Text className='font-bold text-lg'>Nombre</Text>
          <Text className='font-medium'>{orden.cliente_nombre}</Text>
          <Text className='text-lg font-bold mt-2'>Direccion</Text>
          <Text className='font-medium'>{orden.direccion_entrega}</Text>

          <View className="justify-center items-center mt-2">
            <TouchableOpacity className="bg-primary py-2 rounded-full px-8" onPress={() => {
              console.log("🟢 Abriendo modal...");
              setModalVisible(true);
            }}>
              <Text className="text-white font-bold">Ver Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Botones de acción */}

        <View className='flex-row justify-around items-center mt-6'>
          {orden.estado_nombre?.toLowerCase() !== 'cancelada' && (
            <TouchableOpacity
              onPress={() => cambiarEstado('cancelada')}
              className="bg-primary rounded-lg py-3 px-2 w-2/5"
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold">Cancelar Orden</Text>
            </TouchableOpacity>
          )}

          {orden.estado_nombre?.toLowerCase() === 'pendiente' && estado?.id && (
            <TouchableOpacity
              onPress={() => cambiarEstado(estado.id)}
              className="bg-secondary rounded-lg py-3 px-2 w-2/5"
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold">Aceptar Orden</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* Modal del cliente */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              width: "85%",
              alignItems: "center",
            }}
          >
            <Image
              source={{
                uri:
                  orden.cliente_foto ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 10,
              }}
            />
            <Text className="text-lg font-bold mb-1">{orden.cliente_nombre}</Text>
            <Text className="text-gray-500">{orden.cliente_email || "Sin correo"}</Text>

            <View className="flex-row items-center mt-2">
              <Text className="text-gray-500 mr-2">
                {orden.cliente_telefono || "Sin teléfono"}
              </Text>
              {orden.cliente_telefono && (
                <TouchableOpacity
                  onPress={async () => {
                    await Clipboard.setStringAsync(orden.cliente_telefono || '');
                    Alert.alert("📋 Copiado", "Número copiado al portapapeles");
                  }}
                  className="bg-secondary px-3 py-1 rounded-full"
                >
                  <Text className="text-white text-sm font-bold">Copiar</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              className="bg-primary mt-6 py-2 px-8 rounded-full"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white font-bold text-center">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
