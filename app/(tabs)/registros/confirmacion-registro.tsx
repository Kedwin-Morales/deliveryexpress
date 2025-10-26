import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, images } from '@/constants';
import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useFocusEffect, useRouter } from 'expo-router';

export default function ConfirmacionRegistro() {
  const token = useAuthStore((state) => state.user?.token);
  const [email, setEmail] = useState(false);
  const [telefono, setTelefono] = useState(false);
  const [cedula, setCedula] = useState(false);

  const router = useRouter();

  const fetchValidacion = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/usuario/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data[0] : res.data;

      setEmail(!!data.verificacion_email);
      setTelefono(!!data.verificacion_telefono);
      setCedula(!!data.verificacion_identidad);
    } catch (err) {
      console.log("Error obteniendo validaciones:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchValidacion();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const allVerified = email && telefono && cedula;

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='mt-8 justify-center items-center px-4'>
        <Image
          source={images.pizza_detective}
          className="w-64 h-64"
          resizeMode="contain"
        />
      </View>

      <Text className='text-secondary text-center text-3xl font-bold'>Confirma tu registro</Text>

      {/* Botón Cédula */}
      <View className='px-8 mt-4'>
        <TouchableOpacity
          className={`flex-row rounded-full items-center p-4 gap-4 justify-center mt-4 ${cedula ? 'bg-secondary' : 'bg-primary'}`}
          onPress={() => !cedula && router.push("/(tabs)/registros/confirmacion-cedula")}
        >
          <FontAwesome6 name="drivers-license" size={36} color="white" />
          <Text className='text-white font-semibold'>Verifica tu Cédula de Identidad</Text>
        </TouchableOpacity>
      </View>

      {/* Botón Teléfono */}
      <View className='px-8 mt-2'>
        <TouchableOpacity
          className={`flex-row rounded-full items-center p-4 gap-4 justify-center mt-4 ${telefono ? 'bg-secondary' : 'bg-primary'}`}
          onPress={() => !telefono && router.push("/(tabs)/registros/confirmacion-telefono")}
        >
          <MaterialIcons name="smartphone" size={36} color="white" />
          <Text className='text-white font-semibold'>Verifica tu Número de Teléfono</Text>
        </TouchableOpacity>
      </View>

      {/* Botón Email */}
      <View className='px-8 mt-2'>
        <TouchableOpacity
          className={`flex-row rounded-full items-center p-4 gap-4 justify-center mt-4 ${email ? 'bg-secondary' : 'bg-primary'}`}
          onPress={() => !email && router.push("/(tabs)/registros/confirmacion-email")}
        >
          <Ionicons name="mail" size={36} color="white" />
          <Text className='text-white font-semibold'>Verifica tu Correo Electrónico</Text>
        </TouchableOpacity>
      </View>

      {/* Botón Confirmar */}
      <TouchableOpacity
        className={`w-2/4 self-center rounded-xl mt-8 justify-center items-center p-4 ${allVerified ? 'bg-secondary' : 'bg-gray-300'}`}
        disabled={!allVerified}
        onPress={() => allVerified && router.replace('/(tabs)')}
      >
        <Text className={`font-bold ${allVerified ? 'text-white' : 'text-gray-700'}`}>
          Confirmar
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
