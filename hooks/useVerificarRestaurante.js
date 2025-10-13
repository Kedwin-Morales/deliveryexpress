// hooks/useVerificarRestaurante.js
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export const useVerificarRestaurante = () => {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verificar = async () => {
      if (user?.rol !== 'comercio') return;

      try {
        const res = await axios.get(`${API_URL}/restaurantes/restaurantes/mi_restaurante/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const restaurante = res.data;

        const camposIncompletos = !restaurante?.nombre || !restaurante?.descripcion || !restaurante?.direccion || 
                                  !restaurante?.latitud || !restaurante?.longitud || !restaurante?.estado;

        if (!restaurante || camposIncompletos) {
          router.replace('/(comercio)/restaurantes/registrar-restaurante');
        }
      } catch (err) {
        console.log('Verificación restaurante falló:', err);
        router.replace('/(comercio)/restaurantes/registrar-restaurante');
      }
    };

    verificar();
  }, []);
};
