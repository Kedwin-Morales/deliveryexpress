import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { Orden } from '@/type';
import { useFocusEffect, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function Ordenes() {
  const token = useAuthStore((state) => state.user?.token);
  const router = useRouter();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [fechaFilter, setFechaFilter] = useState('');

  const fetchOrdenes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdenes(res.data);
    } catch (err) {
      console.log('Error al obtener las órdenes:', err);
    }
  };

  const fetchEstados = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstados(res.data.map((e: any) => e.nombre)); // Ajusta según tu API

      console.log(res.data.map((e: any) => e.nombre));
    } catch (err) {
      console.log('Error al obtener los estados:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes();
      fetchEstados();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Filtrado por estado y fecha
  const ordenesFiltradas = ordenes
    .filter((orden) => {
      const statusMatch = statusFilter ? orden.estado_nombre === statusFilter : true;
      const fechaMatch = fechaFilter ? orden.creado_en?.startsWith(fechaFilter) : true;
      return statusMatch && fechaMatch;
    })
    .sort((a, b) => (b.numero_orden ?? 0) - (a.numero_orden ?? 0)); // 🔹 de mayor a menor

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
      <View className="p-4">

        <View className="flex-row items-center px-4 py-3 bg-white justify-between ">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.replace('/(comercio)')} className="mr-3 flex-row">
              <Ionicons name="arrow-back" size={22} color="#003399" />
              <Text className="text-xl font-bold text-primary">Atrás</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
            <Ionicons name="notifications" size={32} color="#FF6600" />
          </TouchableOpacity>
        </View>


        <View className='flex-row gap-4 justify-evenly px-4 mt-2'>
          <View className="bg-gray-300 elevation-md rounded-full px-2 w-2/4">
            <Picker
              selectedValue={fechaFilter}
              onValueChange={(itemValue) => setFechaFilter(itemValue)}
            >
              <Picker.Item label="Fecha" value="" />
              {/* Generar últimos 7 días */}
              {Array.from({ length: 7 }).map((_, i) => {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                return <Picker.Item key={fechaStr} label={fechaStr} value={fechaStr} />;
              })}
            </Picker>
          </View>

          <View className="bg-gray-300 elevation-md rounded-full px-2 w-2/4">
            <Picker
              selectedValue={statusFilter}
              onValueChange={(itemValue) => setStatusFilter(itemValue)}
            >
              <Picker.Item label="Estado" value="" />
              {estados.map((estado) => (
                <Picker.Item key={estado} label={estado} value={estado} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Select de Fecha */}

      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} className='mb-28'>
        {ordenesFiltradas.length === 0 ? (
          <Text className="text-gray-500 text-center mt-4">No se encontraron órdenes.</Text>
        ) : (
          ordenesFiltradas.map((orden) => (
            <TouchableOpacity
              key={orden.id}
              className="bg-gray-100 elevation-md rounded-2xl p-4 mb-4 flex-row justify-between items-center"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: colorEstado(orden?.estado_nombre || ""),
              }}
              onPress={() => {
                router.push({
                  pathname: "/(comercio)/ordenes/orden-detalle",
                  params: { id: orden.id },
                });
              }}
            >
              <View>
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-lg text-secondary">
                    Orden #{orden.numero_orden}
                  </Text>

                </View>

                {/* Detalles */}
                <Text className="text-gray-600 mt-2">
                  {new Date(orden.creado_en).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <Text className='mt-2' style={{ color: colorEstado(orden.estado_nombre || "") }}>
                  Estado: {orden.estado_nombre}
                </Text>
              </View>

              <View className='text-center'>
                <Text className='text-xl font-bold text-primary text-center'>${orden.total}</Text>
                <Text className='text-gray-500 text-center text-sm'>Ver Detalles</Text>
              </View>


            </TouchableOpacity>

          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
