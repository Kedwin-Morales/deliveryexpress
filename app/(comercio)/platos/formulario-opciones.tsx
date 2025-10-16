import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import PopupMessage from "@/components/PopupMessage";

export default function FormularioOpciones() {
  const { id } = useLocalSearchParams(); // ID del plato
  const token = useAuthStore((state) => state.user?.token);
  const router = useRouter();

  const {user} = useAuthStore()

  const [tipos, setTipos] = useState([
    { nombre: "", obligatorio: false, multiple: false, opciones: [] as any[] },
  ]);

  const handleAddTipo = () => {
    setTipos([...tipos, { nombre: "", obligatorio: false, multiple: false, opciones: [] }]);
  };

  const handleAddOpcion = (index: number) => {
    const nuevos = [...tipos];
    nuevos[index].opciones.push({ nombre: "", precio_adicional: "" });
    setTipos(nuevos);
  };

  const handleChangeTipo = (index: number, key: string, value: any) => {
    const nuevos = [...tipos];
    (nuevos[index] as any)[key] = value;
    setTipos(nuevos);
  };

  const handleChangeOpcion = (tipoIndex: number, opcionIndex: number, key: string, value: any) => {
    const nuevos = [...tipos];
    (nuevos[tipoIndex].opciones[opcionIndex] as any)[key] = value;
    setTipos(nuevos);
  };

  const handleGuardar = async () => {
    try {
      for (const tipo of tipos) {
        // 1️⃣ Crear el tipo de opción

        const tipoRes = await axios.post(
          `${API_URL}/api/restaurantes/tipos-opciones/`,
          {
            plato: id,
            nombre: tipo.nombre,
            obligatorio: tipo.obligatorio,
            multiple: tipo.multiple,
            restaurante: user?.$id
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const tipoId = tipoRes.data.id;

        // 2️⃣ Crear las opciones dentro de ese tipo
        for (const opcion of tipo.opciones) {
          await axios.post(
            `${API_URL}/api/restaurantes/opciones/`,
            {
              tipo: tipoId,
              nombre: opcion.nombre,
              precio_adicional: parseFloat(opcion.precio_adicional || 0),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      showPopup("Opciones creadas correctamente", "check-circle");
      router.push("/(comercio)/platos");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      showPopup("No se pudieron guardar las opciones","cancel")
    }
  };

  const [popup, setPopup] = useState({
        visible: false,
        message: "",
        icon: "info" as keyof typeof MaterialIcons.glyphMap,
    });

    const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
        setPopup({ visible: true, message, icon });
    };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 justify-between">
        <TouchableOpacity onPress={() => router.push({
          pathname: '/platos/formulario',
          params:{id}
        })} className="flex-row items-center">
          <Ionicons name="arrow-back" size={22} color="#003399" />
          <Text className="text-primary font-bold ml-2 text-lg">Atrás</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-secondary text-center mb-6">
          Configurar Opciones del Plato
        </Text>

        {tipos.map((tipo, i) => (
          <View key={i} className="bg-gray-100 rounded-2xl p-4 mb-6">
            <Text className="font-bold text-lg mb-2 tex-primary">Tipo de Opción #{i + 1}</Text>

            <TextInput
              placeholder="Ej. Tamaño, Extras..."
              value={tipo.nombre}
              onChangeText={(t) => handleChangeTipo(i, "nombre", t)}
              className="bg-white rounded-xl p-3 mb-3"
            />

            <View className="flex-row justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-gray-700">Obligatorio</Text>
                <Switch
                  value={tipo.obligatorio}
                  onValueChange={(v) => handleChangeTipo(i, "obligatorio", v)}
                />
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-gray-700">Múltiple</Text>
                <Switch
                  value={tipo.multiple}
                  onValueChange={(v) => handleChangeTipo(i, "multiple", v)}
                />
              </View>
            </View>

            <Text className="font-semibold text-gray-700 mb-2">Opciones:</Text>

            {tipo.opciones.map((op, j) => (
              <View key={j} className="bg-white rounded-xl p-3 mb-2">
                <TextInput
                  placeholder="Nombre de la opción (Ej. Grande)"
                  value={op.nombre}
                  onChangeText={(t) => handleChangeOpcion(i, j, "nombre", t)}
                  className="border-b border-gray-300 mb-2"
                />
                <TextInput
                  placeholder="Precio adicional (0.00)"
                  keyboardType="numeric"
                  value={op.precio_adicional.toString()}
                  onChangeText={(t) => handleChangeOpcion(i, j, "precio_adicional", t)}
                  className="border-b border-gray-300"
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={() => handleAddOpcion(i)}
              className="bg-primary rounded-full py-2 mt-2"
            >
              <Text className="text-center text-white font-bold">+ Añadir Opción</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleAddTipo}
          className="bg-secondary rounded-full py-3 mb-6"
        >
          <Text className="text-center text-white font-bold text-lg">+ Añadir Tipo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGuardar}
          className="bg-primary rounded-full py-4 mb-10"
        >
          <Text className="text-center text-white font-bold text-lg">Guardar Todo</Text>
        </TouchableOpacity>
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
