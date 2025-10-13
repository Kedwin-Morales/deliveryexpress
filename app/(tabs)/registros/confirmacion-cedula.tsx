import { View, Text, Dimensions, TouchableOpacity, Image } from 'react-native';
import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images, API_URL } from '@/constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import ScreenLoading from '@/components/ScreenLoading';
import PopupMessage from '@/components/PopupMessage';

export default function ConfirmacionCedula() {
  const token = useAuthStore((state) => state.user?.token);

  const [documento, setDocumento] = useState(false); // ✅ indica si ya hay doc
  const [archivo, setArchivo] = useState<string | null>(null); // ✅ guarda URI o file
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  // Abrir cámara
  const tomarFoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setArchivo(result.assets[0].uri);
      setDocumento(true);
    }
  };

  // Seleccionar desde galería
  const subirArchivo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setArchivo(result.assets[0].uri);
      setDocumento(true);
    }
  };

  // Confirmar y enviar a backend
  const confirmar = async () => {
   

    if (archivo) {
      const formData = new FormData();
      formData.append('cedula_imagen', {
        uri: archivo,
        type: 'image/jpeg',
        name: 'documento.jpg',
      } as any);

      try {
        const res = await axios.patch(`${API_URL}/api/user/usuario/${user?.$id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.cedula_imagen) {
          showPopup('Documento validado', 'check-circle')
          router.push('/registros/foto-perfil');
        } else {
          showPopup('No se pudo verificar el documento', 'cancel')
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        showPopup('Hubo un problema al enviar el documento', 'cancel')
      }
    }

    if(documento) {
      router.push('/registros/foto-perfil');
    }

    return  showPopup('Por favor, sube un documento', 'warning');
  };

  useFocusEffect(
    useCallback(() => {
      const fetchUsuario = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/user/usuario/${user?.$id}/`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          });

          setDocumento(res.data.cedula_imagen);
          setLoading(false);
        } catch (error) {
          console.error("Error al cargar perfil:", error);
        }
      };
      fetchUsuario();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.token])
  );

  if (loading) {
    return <ScreenLoading />
  }

  return (
    <SafeAreaView className="flex-1 gap-5 bg-white">
      <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 14 }}>
        <View className="absolute top-8 left-5 z-10 flex-row items-center">
            <TouchableOpacity className="flex-row items-center" onPress={() => router.push('/registros/confirmacion-registro')}>
              <Image source={images.arrowBack} style={{ tintColor: '#003399', width: 20, height: 20 }} />
              <Text className="text-xl text-primary ml-2 font-bold">Atrás</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Text className='text-secondary text-2xl text-center font-extrabold'>Validemos tu identidad</Text>

      {/* Botón cámara */}
      <TouchableOpacity
        className={`mt-4 w-3/5 rounded-xl self-center items-center p-4 gap-2 ${documento ? 'bg-secondary' : 'bg-primary'}`}
        onPress={tomarFoto}
      >
        <FontAwesome6 name="camera" size={72} color="white" />
        <Text className="text-white font-bold text-xl">Tomar una foto a tu documento</Text>
      </TouchableOpacity>

      {/* Botón subir archivo */}
      <TouchableOpacity
        className={`mt-2 w-3/5 rounded-xl self-center items-center p-4 gap-2 ${documento ? 'bg-secondary' : 'bg-primary'}`}
        onPress={subirArchivo}
      >
        <MaterialCommunityIcons name="file-upload" size={72} color="white" />
        <Text className="text-white font-bold text-xl text-center">Sube tu documento</Text>
      </TouchableOpacity>

      {/* Botón confirmar */}
      <TouchableOpacity
        className={`w-2/4 self-center rounded-xl mt-8 justify-center items-center p-4 ${documento ? 'bg-secondary' : 'bg-gray-300'}`}
        disabled={!documento}
        onPress={confirmar}
      >
        <Text className={`font-bold ${documento ? 'text-white' : 'text-gray-700'}`}>
          Confirmar
        </Text>
      </TouchableOpacity>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
