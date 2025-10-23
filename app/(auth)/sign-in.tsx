import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { useAuthStore } from '@/store/auth.store';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import axios from 'axios';
import { API_URL, images } from '@/constants';
import { MaterialIcons } from '@expo/vector-icons';
import PopupMessage from '@/components/PopupMessage';
import { registerForPushNotificationsAsync } from '@/src/utils/notifications';


const SignIn = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = useAuthStore((state) => state.login);

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  const submit = async () => {
    if (!form.email || !form.password) {
      showPopup('Por favor ingresa un Correo Electrónico y Contraseña', 'warning')
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/user/login/`, form);
      const { usuario, token } = response.data;

      login({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: token.access,
        $id: usuario.id,
        $collectionId: '',
        $databaseId: '',
        $createdAt: '',
        $updatedAt: '',
        $permissions: [],
        telefono: usuario.telefono,
        foto_perfil: usuario.foto_perfil,
        foto_perfil_url: usuario.foto_perfil_url,
      });

      const expoPushToken = await registerForPushNotificationsAsync();
      if (expoPushToken) {
        try {
          await axios.post(
            `${API_URL}/api/user/usuario/registrar-expo-token/`,
            { expo_token: expoPushToken },
            { headers: { Authorization: `Bearer ${token.access}` } }
          );

          console.log({ user_id: usuario.id, expo_token: expoPushToken })
          console.log('Token guardado en el backend ✅');
        } catch (err) {
          console.warn('No se pudo guardar el token en el servidor ❌', err);
        }
      }

      showPopup('Inicio sesion correctamente', 'check-circle');

      setTimeout(() => {
        if (usuario.rol === 'comercio') router.replace('/(comercio)');
        if (usuario.rol === 'cliente') router.replace('/(tabs)');
        if (usuario.rol === 'conductor') router.replace('/(delivery)');
      }, 1000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      showPopup('Correo o contraseña incorrectos. Por favor verifica tus datos e inténtalo de nuevo.', 'cancel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* 👆 importante flex-1 y sin rounded aquí */}

      <View className="gap-4 bg-white rounded-lg px-5">
        <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 2.25 }}>
          <ImageBackground
            source={images.express_blanco}
            className="size-full rounded-b-lg"
            resizeMode="stretch"
          />

          <View className="absolute top-14 left-5 z-10 flex-row items-center space-x-2">
            <Link href="/role-select" asChild>
              <TouchableOpacity className="flex-row items-center">
                <Image source={images.arrowBack} style={{ tintColor: '#003399', width: 20, height: 20 }} />
                <Text className="text-xl text-primary ml-2 font-bold">Atrás</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <CustomInput
          placeholder="Ingresa tu correo electrónico"
          value={form.email}
          onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
          label="Correo Electrónico"
          keyboardType="email-address"
        />

        <CustomInput
          placeholder="Ingresa tu contraseña"
          value={form.password}
          onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
          label="Contraseña"
          secureTextEntry
        />

        <CustomButton
          title="Iniciar Sesion"
          style='bg-secondary'
          isLoading={isSubmitting}
          onPress={submit}
        />

        <View className="flex justify-center flex-row gap-2 mb-4">
          <Text className="text-gray-600">No tienes cuenta?</Text>
          <Link href="/sign-up" className="font-bold text-primary">
            Crear Cuenta
          </Link>
        </View>
      </View>

      {/* 👇 siempre al final y fuera del flujo */}
      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );

};

export default SignIn;
