// app/role-select.tsx
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Role } from '@/type';
import { API_URL, images } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import ScreenLoading from '@/components/ScreenLoading';

export default function RoleSelectScreen() {
  const setRole = useAuthStore((state) => state.setRole);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // 👇 Animación de opacidad para el titileo

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/user/roles/`);
        setRoles(res.data);
      } catch (err) {
        console.log("Error cargando roles:", err);
      } finally {
        // ⏳ Delay artificial de 3 segundos antes de ocultar el loading
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchRoles();

  }, []);

  const handleSelect = (roleId: string) => {
    setRole(roleId);
    router.push('/sign-in');
  };

  if (loading) {
    // Pantalla splash con imagen que titilea
    return (
      <ScreenLoading />
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Image
        source={images.carga}
        className="w-full h-96 rounded-b-3xl"
        resizeMode="cover"
      />

      <View className="flex-1 items-center px-5 pt-10">
        <Text className="text-3xl font-extrabold mb-8 text-secondary">¡Cuéntanos de ti!</Text>

        <Text>{API_URL}</Text>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            onPress={() => handleSelect(role.id)}
            className="bg-primary flex-row items-center p-4 rounded-lg w-2/3 mb-4"
          >
             <Ionicons name={role.icons} size={22} color="white" />

            {/* 👇 Texto centrado */}
            <Text className="flex-1 text-center text-white text-2xl font-bold">
              Soy {role.nombre}
            </Text>
          </TouchableOpacity>

        ))}
      </View>
    </View>
  );
}
