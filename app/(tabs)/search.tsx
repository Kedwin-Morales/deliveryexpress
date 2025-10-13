import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css"
import { ScrollView, Text, View, Image, TextInput, FlatList, TouchableOpacity, ImageBackground } from "react-native";
import { images, API_URL } from "@/constants";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { Categoria, Direccion, Restaurante } from "@/type";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome, Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";

const Search = () => {
  const token = useAuthStore((state) => state.user?.token);
  const router = useRouter();
  const { categoriaSeleccionada } = useLocalSearchParams()

  const [direccionPrincipal, setDireccionPrincipal] = useState<Direccion | null>(
    null
  );

  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroSeleccionado, setFiltroSeleccionado] = useState(Array.isArray(categoriaSeleccionada) ? categoriaSeleccionada[0] || "Todos" : categoriaSeleccionada || "Todos");
  const [busqueda, setBusqueda] = useState('');

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

  const fetchRestaurantes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/restaurantes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRestaurantes(res.data);
    } catch (err) {
      console.log("Error cargando restaurantes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDireccionPrincipal = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const principal = res.data.find((d: Direccion) => d.es_predeterminada);
      setDireccionPrincipal(principal || null);
    } catch (err) {
      console.log("Error obteniendo direcciones:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRestaurantes();
      fetchCategorias();
      fetchDireccionPrincipal();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(() => {
    if (categoriaSeleccionada) {
      setFiltroSeleccionado(
        Array.isArray(categoriaSeleccionada)
          ? categoriaSeleccionada[0] || "Todos"
          : categoriaSeleccionada || "Todos"
      );
    }
  }, [categoriaSeleccionada]);

  // ✅ Filtrar por categoría + búsqueda
  // ✅ Filtrar por categoría + búsqueda
  const restaurantesFiltrados = restaurantes.filter((r) => {
    const categoriaNombre =
      typeof r.categoria === "string"
        ? r.categoria
        : r.categoria?.nombre || "";

    const coincideCategoria =
      filtroSeleccionado === "Todos" ||
      categoriaNombre.toLowerCase().includes(filtroSeleccionado.toLowerCase());

    const coincideBusqueda = r.nombre
      ? r.nombre.toLowerCase().includes(busqueda.toLowerCase())
      : false;

    return coincideCategoria && coincideBusqueda;
  });



  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} style={{ marginBottom: 44 }}>

        <View className="flex-row justify-between items-center bg-white rounded-2xl py-3 mb-2 mt-2">
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil/direccion')} className="flex-row gap-2 items-center">
            <FontAwesome5 name="map-marker-alt" size={24} color="#003399" />
            <Text className="text-base font-semibold text-gray-900">
              {direccionPrincipal?.direccion_texto || "Agregar dirección"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/profile")} className="items-center">
            <Ionicons name="notifications" size={32} color="#FF6600" />
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda */}
        <View className="flex-row items-center bg-tertiary rounded-xl pl-8 py-2 mb-4">
          <TextInput
            placeholder="Buscar Restaurantes..."
            value={busqueda}
            onChangeText={setBusqueda}
            className="flex-1 text-base font-semibold text-gray-800"
            placeholderTextColor="#70747a"
          />
          <Image source={images.search} className="w-5 h-5 mr-2" resizeMode="contain" />
        </View>

        <FlatList
          data={categoriasDisponibles}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
          renderItem={({ item }) => {
            const activo = filtroSeleccionado === item.nombre;
            return (
              <TouchableOpacity
                onPress={() =>
                  setFiltroSeleccionado(activo ? "Todos" : item.nombre)
                }
                className={`px-2 items-center`}
              >
                <View
                  className="mb-2 rounded-lg p-2"
                  style={{ backgroundColor: activo ? "#FF6600" : "#666666" }}
                >
                  <Image
                    source={{ uri: item.imagen }}
                    className="w-16 h-16 rounded-md"
                    resizeMode="cover"
                  />
                </View>
                <Text
                  className={`text-sm font-semibold ${activo ? 'text-secondary' : ''}`}
                >
                  {item.nombre}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {loading ? (
          <Text className="text-center text-gray-500">Cargando...</Text>
        ) : restaurantesFiltrados.length === 0 ? (
          <Text className="text-center text-gray-500">No hay restaurantes</Text>
        ) : (
          <View className="mt-6 gap-6">
            {restaurantesFiltrados.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/restaurante/restaurante",
                    params: { id: item.id.toString() },
                  })
                }
                className="rounded-2xl overflow-hidden mb-4"
              >
                <ImageBackground
                  source={images.placeholder}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                  imageStyle={{ borderRadius: 16 }}
                >
                  {/* 🔹 Overlay oscuro */}
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.45)", // 👈 opacidad ajustable
                    }}
                  />

                  {/* 🔹 Contenido encima del overlay */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                    }}
                  >
                    {/* Imagen circular */}
                    <Image
                      source={item.imagen_url ? { uri: item.imagen_url } : images.avatar}
                      className="w-20 h-20 rounded-full border-2 border-white"
                      resizeMode="cover"
                    />

                    {/* Info central */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text className="text-lg font-extrabold text-white" numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text className="text-base text-white font-semibold" numberOfLines={1}>
                        {typeof item.categoria === "string"
                          ? item.categoria
                          : item.categoria?.nombre}{" "}
                        • $$$
                      </Text>
                    </View>

                    {/* Puntuación derecha */}
                    <View className="flex-row items-center">
                      <Text className="text-xl font-bold text-white mr-1">
                        {item.calificacion_promedio?.toFixed(1) ?? "0.0"}
                      </Text>
                      <FontAwesome name="star" size={16} color="#f97316" />
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Search;
