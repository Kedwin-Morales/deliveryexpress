import { View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Bell } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { Orden } from '@/type';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

export default function ComercioHome() {
  const token = useAuthStore((state) => state.user?.token);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [ingresosDia, setIngresosDia] = useState(0);
  const [ventasSemana, setVentasSemana] = useState<number[]>([]);
  const [totalVentasSemana, setTotalVentasSemana] = useState(0);
  const router = useRouter()

  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // -----------------------------
      // Ordenes pendientes (descendente)
      // -----------------------------
      const ordenesPendientes = res.data
        .filter((orden: Orden) => orden?.estado_nombre?.toLowerCase() === "pendiente")
        .sort((a: Orden, b: Orden) => (b.numero_orden ?? 0) - (a.numero_orden ?? 0));

      setOrdenes(ordenesPendientes);

      // -----------------------------
      // Ingresos del día
      // -----------------------------
      const hoy = new Date();
      const hoyStr = hoy.toISOString().split('T')[0];

      const ingresosDiaActual = res.data
        .filter((orden: Orden) =>
          orden?.estado_nombre?.toLowerCase() === "completada" &&
          orden.creado_en?.startsWith(hoyStr)
        )
        .reduce((acc: number, orden: Orden) => acc + (orden.total ?? 0), 0);

      setIngresosDia(ingresosDiaActual);

      // -----------------------------
      // Ventas de la semana (últimos 7 días)
      // -----------------------------
      const ingresosPorDia = Array(7).fill(0); // índice 0: lunes, 6: domingo

      res.data
        .filter((orden: Orden) => orden?.estado_nombre?.toLowerCase() === "completada")
        .forEach((orden: Orden) => {
          if (!orden.creado_en) return;

          const fechaOrden = new Date(orden.creado_en);
          const diffDias = Math.floor((hoy.getTime() - fechaOrden.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDias >= 0 && diffDias < 7) {
            ingresosPorDia[6 - diffDias] += orden.total ?? 0; // números válidos
          }
        });

      // Asegurar que todos los valores sean números
      const ventasSemanaNumeros = ingresosPorDia.map(v => Number(v) || 0);
      setVentasSemana(ventasSemanaNumeros);

      // -----------------------------
      // Total ventas de la semana
      // -----------------------------
      setTotalVentasSemana(ventasSemanaNumeros.reduce((acc, monto) => acc + monto, 0));

    } catch (err) {
      console.log("Error obteniendo órdenes:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrden();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <SafeAreaView className="bg-white flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} className='mb-28'>
        {/* Cards */}
        <View className="flex-row justify-around items-center w-full mt-8">
          <View className="bg-gray-100 w-44 h-28 rounded-xl p-4 justify-between items-center">
            <Text className="text-base text-center font-bold">Pedidos en curso</Text>
            <Text className="text-3xl font-bold text-primary">{ordenes.length}</Text>
          </View>
          <View className="bg-gray-200 w-44 h-28 rounded-xl p-4 justify-between items-center">
            <Text className="text-base text-center font-bold">Ingresos del día</Text>
            <Text className="text-3xl font-bold text-primary">${ingresosDia}</Text>
          </View>
        </View>

        <TouchableOpacity className='bg-primary self-center px-4 py-3 rounded-md mt-4' onPress={ ()=> router.replace('/(comercio)/wallet/wallet')}>
          <Text className='text-white font-medium'>Ver Cartera</Text>
        </TouchableOpacity>

        {/* Tendencias */}
        <Text className="text-center text-secondary mt-8 text-xl font-bold">Tendencias de ventas</Text>


        <View className="flex-col elevation-md bg-white rounded-xl  border-gray-300 px-2 mt-2">
          <Text className="mt-4 font-bold">Ventas semanales</Text>
          <Text className="text-2xl font-bold text-primary">${totalVentasSemana}</Text>

          <View className="items-center mt-6">
            {ventasSemana.length > 0 && (
              <LineChart
                data={{
                  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                  datasets: [{ data: ventasSemana }],
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                yAxisLabel="$"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `#003399`,
                  labelColor: () => '#6b7280',
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#003399',
                  },
                }}
                bezier
                style={{ borderRadius: 16 }}
              />
            )}
          </View>
        </View>

        {/* Notificaciones */}
        <Text className="text-start mt-8 text-xl font-bold">Órdenes</Text>

        <View className='mb-4'>
           {ordenes.length === 0 ? (
          <Text className="text-gray-500 mt-4">No tienes pedidos pendientes.</Text>
        ) : (
          ordenes.slice(0, 5).map((orden) => (
            <TouchableOpacity
              key={orden.id}
              className="flex-row mt-4 items-center elevation-md bg-gray-100 rounded-xl p-2"
              onPress={() =>
                router.push({
                  pathname: '/(comercio)/ordenes/orden-detalle',
                  params: { id: orden.id }
                })
              }>
              <View className="mr-4 mt-1 bg-slate-300 rounded-lg p-4">
                <Bell size={24} color="#5a5d63" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-lg text-gray-900">Pedido #{orden.numero_orden}</Text>
                <Text className="text-base mt-0.5">Cliente: {orden.cliente_nombre}</Text>
                <TouchableOpacity className="bg-primary rounded-full mt-2 py-2 mx-4"
                onPress={() =>
                  router.push({
                    pathname: '/(comercio)/ordenes/orden-detalle',
                    params: { id: orden.id }
                  })
                }>
                <Text className="text-white font-semibold text-center">Ver Detalles</Text>
              </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
