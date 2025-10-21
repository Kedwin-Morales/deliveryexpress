import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import {
    ScrollView,
    Text,
    View,
    Image,
    TextInput,
    FlatList,
    TouchableOpacity,
    ImageBackground,
} from "react-native";
import { API_URL, images } from "@/constants";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Categoria, Direccion } from "@/type";
import { useAuthStore } from "@/store/auth.store";
import { router, useFocusEffect } from "expo-router";
import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useCarrito } from "@/store/useCart";
import Carrusel from "@/components/Carrusel";
import PopupMessage from "@/components/PopupMessage";
import ScreenLoading from "@/components/ScreenLoading";

export default function Index() {
    const token = useAuthStore((state) => state.user?.token);
    const user = useAuthStore((store) => store.user);
    const [direccionPrincipal, setDireccionPrincipal] = useState<Direccion | null>(
        null
    );

    const [loading, setLoading] = useState(true)

    const [restaurantesTop, setRestaurantesTop] = useState<any[]>([]);
    const [categoriasDisponibles, setCategoriasDisponibles] = useState<
        Categoria[]
    >([]);
    const [platosPromocion, setPlatosPromocion] = useState<any[]>([]);

    const { carrito, agregarAlCarrito, quitarDelCarrito } = useCarrito();

    const [popup, setPopup] = useState({
        visible: false,
        message: "",
        icon: "info" as keyof typeof MaterialIcons.glyphMap,
    });

    const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
        setPopup({ visible: true, message, icon });
    };

    const fetchValidacion = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/user/usuario/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = Array.isArray(res.data) ? res.data[0] : res.data;

            const email = data.verificacion_email;
            const telefono = data.verificacion_telefono;
            const cedula = data.verificacion_identidad;
            // Paso 1: Validar cuenta
            if (!email || !telefono || !cedula) {
                showPopup("Debes confirmar tu cuenta antes de continuar.", "warning");
                setTimeout(() => {
                    router.replace("/(tabs)/registros/confirmacion-registro");
                }, 2000);
            }
        } catch (err) {
            console.log("Error en validación de usuario:", err);
        }
    };


    /** 🔹 Obtener categorías */
    const fetchCategorias = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/restaurantes/categorias/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCategoriasDisponibles(res.data);
        } catch (err) {
            console.log("Error obteniendo categorías:", err);
        }
    };

    const fetchRestaurantes = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/restaurantes/restaurantes/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const top = [...res.data]
                .sort(
                    (a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0)
                )
                .slice(0, 5);

            setRestaurantesTop(top);
        } catch (err) {
            console.log("Error obteniendo restaurantes:", err);
        }
    };

    /** 🔹 Obtener platos con descuento */
    const fetchPlatos = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/restaurantes/platos/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const platosConDescuento = res.data.map((plato: any) => {
                const descuento =
                    plato.precio && plato.precio_descuento
                        ? Math.round(
                            ((plato.precio - plato.precio_descuento) / plato.precio) * 100
                        )
                        : 0;

                return { ...plato, descuento };
            });

            const ordenados = [...platosConDescuento].sort(
                (a, b) => b.descuento - a.descuento
            );
            setPlatosPromocion(ordenados);
        } catch (err) {
            console.log("Error obteniendo platos:", err);
        }
    };

    const fetchDireccionPrincipal = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            const principal = res.data.find((d: Direccion) => d.es_predeterminada);
            setDireccionPrincipal(principal || null);
        } catch (err) {
            console.log("Error obteniendo direcciones:", err);
        }
    };

    useEffect(() => {
        fetchValidacion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    useFocusEffect(
        useCallback(() => {
            fetchCategorias();
            fetchPlatos();
            fetchRestaurantes();
            fetchDireccionPrincipal();
            fetchValidacion();
            setLoading(false)

            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    );

    if(loading){
        return <ScreenLoading />
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* 🔹 Card Dirección + Perfil */}
                <View className="flex-row justify-between items-center bg-white rounded-2xl px-4 py-3 mb-2 mt-2 mx-4">
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

                {/* 🔹 Barra de búsqueda */}
                <TouchableOpacity onPress={() => router.push("/search")}>
                    <View className="flex-row items-center bg-tertiary rounded-xl pl-8 py-2 mb-4 mx-4">
                        <TextInput
                            placeholder="Buscar Restaurantes..."
                            value={""}
                            className="flex-1 text-base font-semibold text-gray-800"
                            placeholderTextColor="#70747a"
                            onFocus={() => router.push("/search")}
                        />
                        <Image
                            source={images.search}
                            className="w-5 h-5 mr-2"
                            resizeMode="contain"
                        />
                    </View>
                </TouchableOpacity>

                <View className="px-4 h-40 mb-4">
                    <Carrusel />
                </View>


                {/* 🔹 Categorías */}
                <FlatList
                    data={categoriasDisponibles}
                    horizontal
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8 }}
                    renderItem={({ item }) => {
                        return (
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname: '/(tabs)/search',
                                        params: { categoriaSeleccionada: item.nombre }
                                    })
                                }
                                className={`px-2 items-center`}

                            >
                                <View
                                    className="mb-2 rounded-lg p-2"
                                    style={{ backgroundColor: "#666666" }}
                                >
                                    <Image
                                        source={{ uri: item.imagen }}
                                        className="w-16 h-16 rounded-md"
                                        resizeMode="cover"
                                    />
                                </View>
                                <Text
                                    className={`text-sm font-semibold`}
                                >
                                    {item.nombre}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />

                {/* 🔹 Platos con mayor promoción */}
                <Text className="mt-2 mx-4 mb-4 text-xl font-extrabold">
                    Top 5 Promociones Especiales
                </Text>
                <View className="px-5">
                    <FlatList
                        data={platosPromocion.slice(0, 5)}
                        horizontal
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
                        decelerationRate="fast"
                        renderItem={({ item }) => (
                            <TouchableOpacity

                                className="bg-gray-100 rounded-2xl overflow-hidden w-72 elevation-md"
                                // 👆 my-2 agrega aire para que no se corte la sombra
                                onPress={() =>
                                    router.push({
                                        pathname: "/restaurante/plato-detalle",
                                        params: { id: item.id.toString() },
                                    })
                                }
                            >
                                <View className="relative">
                                    <Image
                                        source={{ uri: item.imagen }}
                                        className="w-full h-32"
                                        resizeMode="cover"
                                    />
                                    {item.descuento > 0 && (
                                        <View className="absolute top-2 left-2 bg-secondary px-2 py-1 rounded-md">
                                            <Text className="text-white text-sm font-semibold">
                                                {item.descuento}% OFF
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View className="px-4 py-2">
                                    <View className="flex-row justify-between items-center">
                                        {/* Nombre del plato */}
                                        <Text className="text-lg font-bold text-gray-800 flex-shrink">
                                            {item.nombre}
                                        </Text>

                                        {/* Puntuación con estrella */}
                                        <View className="flex-row items-center ml-2">
                                            <Text className="text-gray-800 text-base font-bold ml-1">
                                                {item.calificacion_promedio?.toFixed(1) ?? "4.5"}
                                            </Text>
                                            <MaterialCommunityIcons name="star" size={20} color="#FF6600" />
                                        </View>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#003399" />
                                        <Text>{item.restaurante_nombre}</Text>
                                    </View>


                                    {/* Precio + contador */}
                                    <View className="flex-row justify-between items-center mt-2">
                                        {item.descuento > 0 ? (
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-primary text-lg font-bold">
                                                    ${item.precio_descuento}
                                                </Text>
                                                <Text className="line-through text-base text-gray-400 mr-2">
                                                    ${item.precio}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text className="text-gray-800 text-lg font-bold">${item.precio}</Text>
                                        )}

                                            <TouchableOpacity
                                                onPress={() =>router.push({
                                                    pathname: "/restaurante/plato-detalle",
                                                    params: { id: item.id.toString() },
                                                })
                                                }
                                                className="w-10 h-10 rounded-full bg-primary items-center justify-center"
                                            >
                                                <Text className="text-xl font-bold text-white">+</Text>
                                            </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>


                {/* 🔹 Restaurantes Destacados */}
                <Text className="mt-2 mb-2 text-xl font-extrabold mx-4">
                    Restaurantes Destacados
                </Text>
                <FlatList
                    data={restaurantesTop}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={{ gap: 4, paddingHorizontal: 2 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.9}
                            onPress={() =>
                                router.push({
                                    pathname: "/restaurante/restaurante",
                                    params: { id: item.id.toString() },
                                })
                            }
                            className="rounded-2xl overflow-hidden mb-4 mx-4"
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

                    )}
                />
            </ScrollView>
            {/* 👇 siempre al final y fuera del flujo */}
            <PopupMessage
                visible={popup.visible}
                message={popup.message}
                icon={popup.icon}
                onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}