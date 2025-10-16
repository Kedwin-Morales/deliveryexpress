import { useEffect, useState } from "react";
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
  const { user } = useAuthStore();
  const router = useRouter();

  const [tipos, setTipos] = useState<
    { id?: number; nombre: string; obligatorio: boolean; multiple: boolean; opciones: any[] }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  // 🔹 Cargar datos existentes del plato (si ya tiene tipos de opciones)
  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/restaurantes/tipos-opciones/?plato=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const tiposData = await Promise.all(
          res.data.map(async (tipo: any) => {
            const opcionesRes = await axios.get(`${API_URL}/api/restaurantes/opciones/?tipo=${tipo.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return {
              ...tipo,
              opciones: opcionesRes.data,
            };
          })
        );

        setTipos(tiposData.length ? tiposData : [
          { nombre: "", obligatorio: false, multiple: false, opciones: [] },
        ]);
      } catch (err) {
        console.log("❌ Error cargando tipos:", err);
        setTipos([{ nombre: "", obligatorio: false, multiple: false, opciones: [] }]);
      } finally {
        setLoading(false);
      }
    };

    fetchTipos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 🔹 Añadir un nuevo tipo
  const handleAddTipo = () => {
    setTipos([...tipos, { nombre: "", obligatorio: false, multiple: false, opciones: [] }]);
  };

  // 🔹 Eliminar tipo (local o de la BD)
  const handleRemoveTipo = async (index: number, tipoId?: number) => {
    if (tipoId) {
      try {
        await axios.delete(`${API_URL}/api/restaurantes/tipos-opciones/${tipoId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.log("❌ Error eliminando tipo:", err);
      }
    }
    setTipos(tipos.filter((_, i) => i !== index));
  };

  // 🔹 Añadir opción dentro de un tipo
  const handleAddOpcion = (index: number) => {
    const nuevos = [...tipos];
    nuevos[index].opciones.push({ nombre: "", precio_adicional: "" });
    setTipos(nuevos);
  };

  // 🔹 Eliminar opción (local o en BD)
  const handleRemoveOpcion = async (tipoIndex: number, opcionIndex: number, opcionId?: number) => {
    if (opcionId) {
      try {
        await axios.delete(`${API_URL}/api/restaurantes/opciones/${opcionId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.log("❌ Error eliminando opción:", err);
      }
    }

    const nuevos = [...tipos];
    nuevos[tipoIndex].opciones.splice(opcionIndex, 1);
    setTipos(nuevos);
  };

  // 🔹 Cambiar valores
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

  // 🔹 Guardar todo
  const handleGuardar = async () => {
    try {
      for (const tipo of tipos) {
        let tipoId = tipo.id;

        if (!tipoId) {
          // Crear nuevo tipo
          const tipoRes = await axios.post(
            `${API_URL}/api/restaurantes/tipos-opciones/`,
            {
              plato: id,
              nombre: tipo.nombre,
              obligatorio: tipo.obligatorio,
              multiple: tipo.multiple,
              restaurante: user?.$id,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          tipoId = tipoRes.data.id;
        } else {
          // Actualizar tipo existente
          await axios.put(
            `${API_URL}/api/restaurantes/tipos-opciones/${tipo.id}/`,
            {
              nombre: tipo.nombre,
              obligatorio: tipo.obligatorio,
              multiple: tipo.multiple,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        // Guardar o actualizar opciones
        for (const opcion of tipo.opciones) {
          if (opcion.id) {
            await axios.put(
              `${API_URL}/api/restaurantes/opciones/${opcion.id}/`,
              {
                nombre: opcion.nombre,
                precio_adicional: parseFloat(opcion.precio_adicional || 0),
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else {
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
      }

      showPopup("Opciones guardadas correctamente", "check-circle");
      router.push("/(comercio)/platos");
    } catch (err) {
      console.log("❌ Error guardando opciones:", err);
      showPopup("No se pudieron guardar las opciones", "cancel");
    }
  };

  if (loading) return <Text className="text-center mt-10 text-gray-500">Cargando opciones...</Text>;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 justify-between">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/platos/formulario",
              params: { id },
            })
          }
          className="flex-row items-center"
        >
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
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold text-lg text-primary">Tipo #{i + 1}</Text>
              <TouchableOpacity onPress={() => handleRemoveTipo(i, tipo.id)}>
                <MaterialIcons name="delete" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>

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
                <View className="flex-row justify-between items-center">
                  <TextInput
                    placeholder="Nombre de la opción"
                    value={op.nombre}
                    onChangeText={(t) => handleChangeOpcion(i, j, "nombre", t)}
                    className="border-b border-gray-300 flex-1 mr-2"
                  />
                  <TouchableOpacity onPress={() => handleRemoveOpcion(i, j, op.id)}>
                    <MaterialIcons name="delete" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="Precio adicional (0.00)"
                  keyboardType="numeric"
                  value={op.precio_adicional?.toString() || ""}
                  onChangeText={(t) => handleChangeOpcion(i, j, "precio_adicional", t)}
                  className="border-b border-gray-300 mt-2"
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

        <TouchableOpacity onPress={handleAddTipo} className="bg-secondary rounded-full py-3 mb-6">
          <Text className="text-center text-white font-bold text-lg">+ Añadir Tipo</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGuardar} className="bg-primary rounded-full py-4 mb-10">
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
