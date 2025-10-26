/* eslint-disable @typescript-eslint/no-unused-vars */
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL, VenezuelaEstados } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import PopupMessage from "@/components/PopupMessage";
import { Picker } from '@react-native-picker/picker';

export default function FormularioDireccion() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);

  const [nombre, setNombre] = useState("");
  const [calle, setCalle] = useState("");
  const [puntoReferencia, setPuntoReferencia] = useState("");
  const [latitud, setLatitud] = useState(0.0);
  const [longitud, setLongitud] = useState(0.0);
  const [esPredeterminada, setEsPredeterminada] = useState(false);

  // Para Estado y Municipio
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estadosData, setEstadosData] = useState<{ nombre: string; municipios: string[] }[]>([]);
  const [municipiosData, setMunicipiosData] = useState<string[]>([]);

  // Loader
  const [loadingDireccion, setLoadingDireccion] = useState(false);

  // Popup
  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  // 🔹 Cargar estados desde el JSON importado
  useEffect(() => {
    const mappedEstados = VenezuelaEstados.map(e => ({
      nombre: e.estado,
      municipios: e.municipios.map(m => m.municipio)
    }));
    setEstadosData(mappedEstados);
  }, []);

  // 🔹 Actualizar municipios al cambiar estado
  useEffect(() => {
    const estadoSeleccionado = estadosData.find(e => e.nombre === estado);
    if (estadoSeleccionado) {
      setMunicipiosData(estadoSeleccionado.municipios);
      setMunicipio("");
    } else {
      setMunicipiosData([]);
      setMunicipio("");
    }
  }, [estado, estadosData]);

  // 🔹 Cargar dirección si hay id
  useFocusEffect(
    useCallback(() => {
      const fetchDireccion = async () => {
        if (!id) return resetForm();

        try {
          setLoadingDireccion(true);
          const response = await axios.get(`${API_URL}/api/user/direcciones/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = response.data;
          const direccionParts = d.direccion_texto.split(",").map((part: string) => part.trim());

          setNombre(d.nombre);
          setEstado(direccionParts[0] || "");
          setMunicipio(direccionParts[1] || "");
          setCalle(direccionParts[2] || "");
          setPuntoReferencia(direccionParts[3] || "");
          setLatitud(parseFloat(d.latitud));
          setLongitud(parseFloat(d.longitud));
          setEsPredeterminada(d.es_predeterminada);
        } catch (error) {
          console.error("Error al cargar dirección:", error);
          showPopup("Error al cargar la dirección", "cancel");
        } finally {
          setLoadingDireccion(false);
        }
      };

      const resetForm = () => {
        setNombre("");
        setEstado("");
        setMunicipio("");
        setCalle("");
        setPuntoReferencia("");
        setLatitud(0.0);
        setLongitud(0.0);
        setEsPredeterminada(false);
      };

      fetchDireccion();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  // Capturar lat/lng desde mapa
  const params = useLocalSearchParams();
  useEffect(() => {
    if (params.latitud && params.longitud) {
      setLatitud(parseFloat(params.latitud as string));
      setLongitud(parseFloat(params.longitud as string));
    }
  }, [params]);

  // Guardar dirección
  const handleSubmit = async () => {
    const direccionCompleta = `${estado}, ${municipio}, ${calle}, ${puntoReferencia}`;

    const payload = {
      nombre,
      direccion_texto: direccionCompleta,
      latitud,
      longitud,
      es_predeterminada: esPredeterminada,
    };

    try {
      if (!id && esPredeterminada) {
        const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const yaExistePredeterminada = res.data.some((d: any) => d.es_predeterminada);
        if (yaExistePredeterminada) {
          return showPopup(
            'Ya tienes una dirección predeterminada. Debes editarla o eliminarla antes de crear una nueva predeterminada.',
            'cancel'
          );
        }
      }

      if (id) {
        await axios.put(`${API_URL}/api/user/direcciones/${id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showPopup('Dirección editada correctamente', 'check-circle');
      } else {
        await axios.post(`${API_URL}/api/user/direcciones/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showPopup('Dirección creada correctamente', 'check-circle');
      }

      setTimeout(() => { router.replace("/perfil/direccion"); }, 2000);
    } catch (error) {
      showPopup('Error al guardar dirección', 'cancel');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pb-6">
      <View className="flex-row items-center px-4 py-3 bg-white justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil/direccion')} className="mr-3 flex-row">
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary">Atrás</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
          <Ionicons name="notifications" size={32} color="#FF6600" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {loadingDireccion ? (
          // Skeleton loader mientras carga
          <>
            {[1, 2, 3, 4, 5].map(i => (
              <View key={i} className="h-14 bg-gray-200 rounded-xl mb-4 animate-pulse" />
            ))}
          </>
        ) : (
          <>
            {/* Nombre */}
            <Text className="text-gray-800 mt-2 mb-1 font-bold">Nombre de la dirección</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Casa, Trabajo"
            />

            {/* Estado */}
            <Text className="text-gray-800 font-bold mb-1">Estado</Text>
            <View className="bg-gray-100 rounded-xl mb-4">
              <Picker selectedValue={estado} onValueChange={setEstado}>
                <Picker.Item label="Selecciona un estado" value="" />
                {estadosData.map(e => (
                  <Picker.Item key={e.nombre} label={e.nombre} value={e.nombre} />
                ))}
              </Picker>
            </View>

            {/* Municipio */}
            <Text className="text-gray-800 font-bold mb-1">Municipio</Text>
            <View className="bg-gray-100 rounded-xl mb-4">
              <Picker selectedValue={municipio} onValueChange={setMunicipio} enabled={municipiosData.length > 0}>
                <Picker.Item label="Selecciona un municipio" value="" />
                {municipiosData.map(m => (
                  <Picker.Item key={m} label={m} value={m} />
                ))}
              </Picker>
            </View>

            {/* Calle */}
            <Text className="text-gray-800 font-bold mb-1">Calle</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
              value={calle}
              onChangeText={setCalle}
              placeholder="Ej. Calle 123"
            />

            {/* Punto de Referencia */}
            <Text className="text-gray-800 font-bold mb-1">Punto de Referencia</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
              value={puntoReferencia}
              onChangeText={setPuntoReferencia}
              placeholder="Ej. La casa naranja ..."
            />

            {/* Predeterminada */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-gray-800 font-semibold">¿Es predeterminada?</Text>
              <Switch value={esPredeterminada} onValueChange={setEsPredeterminada} />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/perfil/seleccionar-direccion")}
              className="bg-gray-100 py-3 rounded-lg mb-4"
            >
              <Text className="text-center text-primary font-bold">
                Seleccionar en el mapa
              </Text>
            </TouchableOpacity>

            {/* Botón Guardar */}
            <View className="px-6 items-center">
              <TouchableOpacity
                className="bg-secondary rounded-xl py-3 mt-4 mx-6 w-3/4"
                onPress={handleSubmit}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {id ? "Guardar Cambios" : "Guardar Dirección"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-3/4"
                onPress={() => router.push('/(tabs)/perfil/direccion')}
              >
                <Text className="text-primary text-center font-bold text-lg mt-4">
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
