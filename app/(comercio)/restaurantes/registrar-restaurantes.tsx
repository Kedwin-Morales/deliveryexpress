import React, { useEffect, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
  Image,
} from 'react-native';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { API_URL } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Estado } from '@/type';
import { router, useLocalSearchParams } from 'expo-router';
import TimePickerInput from '@/components/TimePickerInput';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import CountryPicker from 'react-native-country-picker-modal';

interface Categoria {
  id: string;
  nombre: string;
}

export default function RegistrarRestaurante() {
  const token = useAuthStore((state) => state.user?.token);
  const user = useAuthStore((state) => state.user); // Usuario actual
  const params = useLocalSearchParams<{ latitud?: string; longitud?: string }>();

  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [horaApertura, setHoraApertura] = useState('');
  const [horaCierre, setHoraCierre] = useState('');

  const [estado, setEstado] = useState<string>('');
  const [estadosDisponibles, setEstadosDisponibles] = useState<Estado[]>([]);

  const [categoria, setCategoria] = useState<string>('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([]);

  const [telefono, setTelefono] = useState(
    user?.telefono ? user.telefono.replace(/^\+\d{1,3}/, '') : ''
  );
  const [paginaWeb, setPaginaWeb] = useState('');
  const [capacidad, setCapacidad] = useState('');

  const [imagen, setImagen] = useState<ImagePickerAsset | null>(null);

  // Country picker
  const [country, setCountry] = useState({
    cca2: 'VE', // 🇻🇪 Venezuela
    callingCode: ['58'],
  });
  const [visible, setVisible] = useState(false);

  const onSelect = (countrySelected: any) => {
    setCountry(countrySelected);
  };

  // Pick image
  const pickImage = async (
    setter: React.Dispatch<React.SetStateAction<ImagePickerAsset | null>>
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setter(result.assets[0]);
    }
  };

  // Fetch restaurante existente
  const fetchRestaurante = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.id) {
        const r = res.data;
        setRestauranteId(r.id);
        setNombre(r.nombre || '');
        setDescripcion(r.descripcion || '');
        setDireccion(r.direccion || '');
        setLatitud(String(r.latitud || ''));
        setLongitud(String(r.longitud || ''));
        setEstado(r.estado || '');
        setHoraApertura(r.horario_apertura || '');
        setHoraCierre(r.horario_cierre || '');
        setCategoria(r.categoria.id || '');
        setTelefono(r.telefono ? r.telefono.replace(/^\+\d{1,3}/, '') : '');
        setPaginaWeb(r.pagina_web || '');
        setCapacidad(String(r.capacidad || ''));

        if (r.imagen) {
          setImagen({
            uri: r.imagen_url,
            width: 0,
            height: 0,
            fileName: "server-image.jpg",
            type: "image/jpeg",
          } as any);
        }
      }
    } catch (err) {
      console.log('Error cargando restaurante:', err);
    }
  };

  // Fetch listas
  const fetchEstados = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/estados/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstadosDisponibles(res.data);
    } catch (err) {
      console.log('Error obteniendo estados:', err);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/categorias/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriasDisponibles(res.data);
    } catch (err) {
      console.log('Error obteniendo categorías:', err);
    }
  };

  // Convertir hora a 24h
  const convertirHora24 = (hora: string) => {
    if (!hora) return "";
    const pm = hora.toLowerCase().includes("pm");
    const am = hora.toLowerCase().includes("am");
    let [h, m] = hora.replace(/(am|pm)/i, "").trim().split(":");
    let horas = parseInt(h, 10);
    let minutos = parseInt(m, 10);
    if (pm && horas < 12) horas += 12;
    if (am && horas === 12) horas = 0;
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:00`;
  };

  const handleGuardar = async () => {
    // Validar teléfono
    if (telefono.length !== 10) {
      Alert.alert('Número inválido', 'El número de teléfono debe tener exactamente 10 dígitos');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('direccion', direccion);
    formData.append('latitud', latitud);
    formData.append('longitud', longitud);
    formData.append('horario_apertura', convertirHora24(horaApertura));
    formData.append('horario_cierre', convertirHora24(horaCierre));
    formData.append('estado', estado);

    if (categoria) formData.append('categoria_id', categoria);

    const fullPhone = `+${country.callingCode[0]}${telefono}`;
    formData.append('telefono', fullPhone);
    formData.append('pagina_web', paginaWeb);
    formData.append('capacidad', capacidad);

    if (imagen) {
      formData.append('imagen', {
        uri: imagen.uri,
        type: 'image/jpeg',
        name: 'imagen.jpg',
      } as any);
    }

    try {
      if (restauranteId) {
        await axios.patch(
          `${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        Alert.alert('Actualizado', 'Restaurante actualizado correctamente');
        router.replace('/(comercio)/perfil');
      } else {
        await axios.post(
          `${API_URL}/api/restaurantes/restaurantes/`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        Alert.alert('Registrado', 'Restaurante registrado correctamente');
        router.replace('/(comercio)');
      }
    } catch (err) {
      console.log('Error al guardar restaurante:', err);
      Alert.alert('Error', 'No se pudo guardar la información');
    }
  };

  useEffect(() => {
    fetchRestaurante();
    fetchEstados();
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (params?.latitud && params?.longitud) {
      setLatitud(params.latitud);
      setLongitud(params.longitud);
    }
  }, [params]);

  return (
    <SafeAreaView className="flex-1 bg-white px-5">
      <View className="flex-row items-center px-4 py-3 bg-white justify-between">
        <TouchableOpacity onPress={() => router.replace('/(comercio)/perfil')} className="flex-row items-center">
          <Ionicons name="arrow-back" size={22} color="#003399" />
          <Text className="text-xl font-bold text-primary ml-2">Atrás</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 mb-28 pb-32">
        {imagen && <Image className='w-32 h-32 rounded-full self-center' source={{ uri: imagen.uri }} />}
        <TouchableOpacity
          className="bg-gray-200 rounded-lg px-4 py-2 mb-2 self-center flex-row gap-2 items-center"
          onPress={() => pickImage(setImagen)}
        >
          <FontAwesome name="camera" size={18} color="black" />
          <Text className='text-lg font-semibold'>{imagen ? 'Cambiar Imagen' : 'Seleccionar Imagen'}</Text>
        </TouchableOpacity>

        {/* Nombre */}
        <Text className="font-bold mb-1 mt-4">Nombre del Restaurante</Text>
        <TextInput
          className="bg-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-800 font-semibold"
          value={nombre}
          onChangeText={setNombre}
        />

        {/* Descripción */}
        <Text className="font-bold mb-1 mt-4">Descripción</Text>
        <TextInput
          className="bg-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-800 font-semibold"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />

        {/* Dirección */}
        <Text className="font-bold mb-1 mt-4">Dirección</Text>
        <TextInput
          className="bg-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-800 font-semibold"
          value={direccion}
          onChangeText={setDireccion}
        />
        <TouchableOpacity
          className="items-center flex-row gap-2 mb-4"
          onPress={() => router.push('/restaurantes/seleccionar-direccion')}
        >
          <FontAwesome name="map-marker" size={24} color="#003399" />
          <Text className="text-primary font-bold text-lg">Seleccionar en el mapa</Text>
        </TouchableOpacity>

        {/* Horarios */}
        <TimePickerInput label="Hora de Apertura" value={horaApertura} onChange={setHoraApertura} />
        <TimePickerInput label="Hora de Cierre" value={horaCierre} onChange={setHoraCierre} />

        {/* Estado */}
        <Text className="font-bold mb-1 mt-2">Estado</Text>
        <View className="bg-gray-200 rounded-xl mb-4">
          <Picker selectedValue={estado} onValueChange={(itemValue) => setEstado(itemValue)} style={{ height: 50 }}>
            <Picker.Item label="Selecciona un estado" value="" />
            {estadosDisponibles.map((estadoItem) => (
              <Picker.Item key={estadoItem.id} label={estadoItem.nombre} value={estadoItem.id} />
            ))}
          </Picker>
        </View>

        {/* Categoría */}
        <Text className="font-bold mb-1 mt-2">Categoría</Text>
        <View className="bg-gray-200 rounded-xl mb-4">
          <Picker selectedValue={categoria} onValueChange={(itemValue) => setCategoria(itemValue)} style={{ height: 50 }}>
            <Picker.Item label="Selecciona una categoría" value="" />
            {categoriasDisponibles.map((cat) => (
              <Picker.Item key={cat.id} label={cat.nombre} value={cat.id} />
            ))}
          </Picker>
        </View>

        {/* Teléfono con CountryPicker */}
        <View className='flex-row items-center gap-2 mb-4'>
          <View className='flex-row items-center bg-gray-300 px-1 py-3 rounded-lg'>
            <CountryPicker
              countryCode={country.cca2 as any}
              withFilter
              withFlag
              withCallingCode
              withEmoji
              onSelect={onSelect}
              visible={visible}
              onClose={() => setVisible(false)}
            />
            <TouchableOpacity onPress={() => setVisible(true)}>
              <Text style={{ fontSize: 16, marginRight: 5 }}>+{country.callingCode[0]}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder="Ingresa tu numero de telefono"
              value={telefono}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                if (cleaned.length <= 10) setTelefono(cleaned);
              }}
              keyboardType="phone-pad"
              className="bg-gray-200 rounded-lg px-4 py-3 text-gray-800 font-semibold"
            />
          </View>
        </View>

        {/* Página Web */}
        <Text className="font-bold mb-1 mt-4">Página Web</Text>
        <TextInput
          className="bg-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-800 font-semibold"
          value={paginaWeb}
          onChangeText={setPaginaWeb}
        />

        {/* Capacidad */}
        <Text className="font-bold mb-1 mt-4">Capacidad</Text>
        <TextInput
          className="bg-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-800 font-semibold"
          value={capacidad}
          onChangeText={setCapacidad}
          keyboardType="numeric"
        />

        {/* Botón guardar */}
        <TouchableOpacity onPress={handleGuardar} className="bg-secondary rounded-full py-3 mt-8 mb-4">
          <Text className="text-white text-center font-semibold text-lg">
            {restauranteId ? 'Guardar Cambios' : 'Registrar Restaurante'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(comercio)/perfil')} className="mb-8">
          <Text className="text-primary text-center font-semibold text-lg">
            Cancelar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
