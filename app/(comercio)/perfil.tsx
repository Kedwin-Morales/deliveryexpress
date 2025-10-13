import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native'
import React, { useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { API_URL} from '@/constants';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { Restaurante } from '@/type';
import { useRouter, useFocusEffect } from 'expo-router';
import { Entypo, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';


export default function Perfil() {

  const token = useAuthStore((state) => state.user?.token);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);

  const getRestaurante = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRestaurante(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      getRestaurante();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <SafeAreaView className='bg-white flex-1 pb-28'>

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

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {/* Cards */}
        <View className="flex-row justify-around items-center w-full px-4">
          <Image source={{ uri: restaurante?.imagen_url }} className='w-28 h-28 rounded-full mr-2' />

          <View>
            <Text className='mt-4 text-lg font-bold'>{restaurante?.nombre.toUpperCase()}</Text>
            <Text className='text-neutral-600 w-56'>{restaurante?.descripcion}</Text>
            <Text className='text-neutral-600'>{restaurante?.calificacion_promedio}</Text>
          </View>
        </View>

        <View className='flex-col mt-6'>
          <Text className='text-lg font-bold text-secondary'>Informacion del restaurante</Text>
          <View
            className="flex-row mt-4 items-center"
          >
            <View className="mr-4 mt-1 bg-primary rounded-lg py-2 px-4">
              <FontAwesome name="map-marker" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">Direccion</Text>
              <Text className="text-sm text-gray-500">{restaurante?.direccion}</Text>
            </View>
          </View>
          <View
            className="flex-row mt-3 items-center"
          >
            <View className="mr-4 mt-1 bg-primary rounded-lg p-2">
              <MaterialCommunityIcons name="clock" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">Horario de Atencion</Text>
              <Text className="text-sm text-gray-500">{restaurante?.horario_apertura} - {restaurante?.horario_cierre}</Text>
            </View>
          </View>
          <View
            className="flex-row mt-3 items-center"
          >
            <View className="mr-4 mt-1 bg-primary rounded-lg p-2">
              <MaterialCommunityIcons name="silverware-fork-knife" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">Tipo de cocina</Text>
              <Text className="text-base text-gray-500">{restaurante?.categoria?.nombre}</Text>
            </View>
          </View>

          <TouchableOpacity className="rounded-xl bg-secondary px-5 mt-8 py-3 flex-row items-center justify-center" onPress={() => router.push('/(comercio)/restaurantes/registrar-restaurantes')}>
            <Text className='font-semibold ml-2 text-white text-lg'>Editar Informacion</Text>
          </TouchableOpacity>

        </View>


        <TouchableOpacity
          className="flex-row mt-3 items-center justify-center"
        >
            <Entypo name="tools" size={24} color="#003399" />
            <Text className="font-semibold text-lg text-primary">Soporte Tecnico</Text>
        </TouchableOpacity>           

        <TouchableOpacity
          onPress={logout}
          className="bg-white py-4 flex-row justify-center items-center border border-red-400 w-3/4 rounded-2xl mt-6 mb-4 self-center"
        >
          <Ionicons name="log-out-outline" size={20} color="red" />
          <Text className="text-red-600 font-bold ml-2">Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}