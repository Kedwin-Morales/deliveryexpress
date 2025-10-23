import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Estado, Orden } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import RutaMapa from "@/components/RutaMapa";
import * as Clipboard from "expo-clipboard";


export default function OrdenDetalle() {
    const { id } = useLocalSearchParams(); // id desde la ruta
    const token = useAuthStore((state) => state.user?.token);
    const router = useRouter();
    const [estados, setEstados] = useState<Estado[]>();

    const [orden, setOrden] = useState<Orden | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false); // 👈 Estado del modal

    // 🚚 Obtener detalle de la orden
    const fetchOrden = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrden(res.data);
        } catch (err) {
            console.log("Error obteniendo la orden:", err);
        }
    };

    const fetchEstados = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEstados(res.data); // Asignar el primer estado "En camino" encontrado
        } catch (err) {
            console.log('Error al obtener los estados:', err);
        }
    };

    // 🚀 Cambiar estado de la orden
    const cambiarEstado = async (nuevoEstado: string) => {
        if (!orden) return;
        setLoading(true);
        try {
            await axios.patch(
                `${API_URL}/api/ordenes/ordenes/${id}/cambiar-estado/`,
                { estado: nuevoEstado },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert("✅ Éxito", `La orden cambió a "${nuevoEstado}"`);
            fetchOrden();
        } catch (err) {
            Alert.alert("Error", "No se pudo cambiar el estado.");
            console.log("Error actualizando estado:", err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrden();
            fetchEstados();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    );

    if (!orden) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Cargando orden...</Text>
            </SafeAreaView>
        );
    }

    // Colores según estado
    const colorEstado = (estado?: string) => {
        switch (estado?.toLowerCase()) {
            case "asignada":
                return "#FF9800";
            case "en camino":
                return "#009688";
            case "entregada":
                return "#4CAF50";
            case "cancelada":
                return "#F44336";
            default:
                return "#9E9E9E";
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.push('/(delivery)/historial')} className="mr-3 flex-row">
                        <Ionicons name="arrow-back" size={22} color="#003399" />
                        <Text className="text-xl font-bold text-primary">Atrás</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
                    <Ionicons name="notifications" size={32} color="#FF6600" />
                </TouchableOpacity>
            </View>

            {/* Contenido */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
                <Text className="text-secondary font-bold text-2xl text-center">Detalle de Orden</Text>
                {/* Estado */}
                <View
                    className="elevation-md rounded-xl p-4 px-6 bg-gray-100 mt-6"
                >
                    <View className="justify-between flex-row">
                        <Text className="text-secondary text-lg font-bold">Pedido #{orden.numero_orden}</Text>

                        <Text className="text-primary text-lg font-bold">${orden.total}</Text>
                    </View>
                    <Text className="">{new Date(orden.creado_en).toLocaleDateString()}</Text>
                    <Text className="font-semibold mt-4" style={{ color: colorEstado(orden?.estado_nombre) }}>
                        Estado: {orden.estado_nombre}
                    </Text>
                </View>

                {/* Platos */}

                <Text className="text-xl font-bold text-secondary mt-4">Platos de la Orden</Text>

                {orden.detalles?.map((item, index) => (
                    <View key={index} className="flex-row items-center justify-between mt-3 bg-gray-100 rounded-2xl p-4 elevation-md">
                        <View className="flex-row items-center">
                            <Image
                                source={{ uri: item.plato_imagen }}
                                className="h-28 w-28 rounded-lg mr-3"
                                resizeMode="cover"
                            />
                            <View>
                                <Text className="font-semibold">{item.plato_nombre}</Text>
                                <Text className="text-gray-500">x{item.cantidad}</Text>
                            </View>
                        </View>
                        <Text className="font-bold text-primary">${item.precio_unitario}</Text>
                    </View>
                ))}


                <Text className="mt-4 font-bold text-secondary text-xl">Información del Cliente</Text>
                <View className="bg-gray-100 rounded-2xl elevation-md p-4 mt-2">
                    <Text className="font-bold text-lg">Nombre</Text>
                    <Text className="font-medium">{orden.cliente_nombre}</Text>

                    <Text className="mt-2 font-bold text-lg">Direccion</Text>
                    <Text className="font-medium">{orden.direccion_entrega}</Text>

                    <View className="justify-center items-center mt-2">
                        <TouchableOpacity className="bg-primary py-2 rounded-full px-8" onPress={() => {
                            console.log("🟢 Abriendo modal...");
                            setModalVisible(true);
                        }}>
                            <Text className="text-white font-bold">Ver Perfil</Text>
                        </TouchableOpacity>
                    </View>


                </View>

                <RutaMapa
                    ordenId={orden.id}
                    destino={{
                        latitude: orden.latitud ?? 10.4806,
                        longitude: orden.longitud ??  -66.9036,
                    }}
                 />

                {/* Botones según estado */}
                {orden.estado_nombre?.toLowerCase() === "asignada" && (
                    <TouchableOpacity
                        onPress={() => {
                            // Buscar el estado "En camino" en la lista de estados
                            const enCaminoEstado = estados?.find((e) => e.nombre.toLowerCase() === "en camino");
                            if (enCaminoEstado) {
                                cambiarEstado(enCaminoEstado.id.toString()); // enviar el id como string
                            } else {
                                Alert.alert("Error", "No se encontró el estado 'En camino'");
                            }
                        }}
                        className="bg-secondary py-3 rounded-xl mb-4 mt-6 mx-6"
                        disabled={loading}
                    >
                        <Text className="text-white text-center font-bold text-lg">Iniciar ruta</Text>
                    </TouchableOpacity>
                )}

                {orden.estado_nombre?.toLowerCase() === "en camino" && (
                    <TouchableOpacity
                        onPress={() => {
                            // Buscar el estado "Entregada" en la lista de estados
                            const entregadaEstado = estados?.find((e) => e.nombre.toLowerCase() === "entregada");
                            if (entregadaEstado) {
                                cambiarEstado(entregadaEstado.id.toString());
                            } else {
                                Alert.alert("Error", "No se encontró el estado 'Entregada'");
                            }
                        }}
                        className="bg-secondary py-3 rounded-xl mb-4 mt-6 mx-6"
                        disabled={loading}
                    >
                        <Text className="text-white text-center font-bold text-lg">✅ Finalizar entrega</Text>
                    </TouchableOpacity>
                )}


                {orden.estado_nombre?.toLowerCase() === "entregada" && (
                    <Text className="text-center text-lg text-green-600 font-bold mt-6">
                        ✔️ Orden entregada
                    </Text>
                )}
            </ScrollView>

            {/* Modal del cliente */}
            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "white",
                            borderRadius: 20,
                            padding: 20,
                            width: "85%",
                            alignItems: "center",
                        }}
                    >
                        <Image
                            source={{
                                uri:
                                    orden.cliente_foto ||
                                    "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                            }}
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                marginBottom: 10,
                            }}
                        />
                        <Text className="text-lg font-bold mb-1">{orden.cliente_nombre}</Text>
                        <Text className="text-gray-500">{orden.cliente_email || "Sin correo"}</Text>

                        <View className="flex-row items-center mt-2">
                            <Text className="text-gray-500 mr-2">
                                {orden.cliente_telefono || "Sin teléfono"}
                            </Text>
                            {orden.cliente_telefono && (
                                <TouchableOpacity
                                    onPress={async () => {
                                        await Clipboard.setStringAsync(orden.cliente_telefono || '');
                                        Alert.alert("📋 Copiado", "Número copiado al portapapeles");
                                    }}
                                    className="bg-secondary px-3 py-1 rounded-full"
                                >
                                    <Text className="text-white text-sm font-bold">Copiar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            className="bg-primary mt-6 py-2 px-8 rounded-full"
                            onPress={() => setModalVisible(false)}
                        >
                            <Text className="text-white font-bold text-center">Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}