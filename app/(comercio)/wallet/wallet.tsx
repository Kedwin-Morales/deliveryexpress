import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Wallet } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function WalletComponent() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState<boolean>(false);

    const token = useAuthStore((state) => state.user?.token);
    const user = useAuthStore((state) => state.user);

    // 🔹 1️⃣ Obtener wallet al montar
    useEffect(() => {
        const fetchWallet = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/wallet/wallets/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.length > 0) {
                    setWallet(response.data[0]);
                } else {
                    setWallet(null);
                }

                console.log("Wallet data:", response.data);
            } catch (err: any) {
                console.error(err);
                setError("Error al cargar la wallet");
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, [user]);

    // 🔹 2️⃣ Crear wallet
    const handleCrearWallet = async () => {
        try {
            setCreating(true);
            const response = await axios.post(
                `${API_URL}/api/wallet/wallets/create_wallet/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setWallet(response.data.wallet);
            } else {
                setError("No se pudo crear la wallet");
            }
        } catch (err: any) {
            console.error(err);
            setError("Error al crear la wallet");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <ActivityIndicator className="flex-1" size="large" color="#003399" />;

    return (
        <SafeAreaView className="flex-1 p-4 bg-white">

            <View className="flex-row items-center px-4 py-3 bg-white justify-between">
                <TouchableOpacity onPress={() => router.replace('/(comercio)/perfil')} className="flex-row items-center">
                    <Ionicons name="arrow-back" size={22} color="#003399" />
                    <Text className="text-xl font-bold text-primary ml-2">Atrás</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/profile")}>
                    <Ionicons name="notifications" size={32} color="#FF6600" />
                </TouchableOpacity>
            </View>

            {!wallet ? (
                <View className="items-center justify-center flex-1">
                    <Text className="text-lg mb-4">No tienes wallet aún</Text>
                    <TouchableOpacity
                        className="bg-blue-600 px-6 py-3 rounded-lg"
                        onPress={handleCrearWallet}
                        disabled={creating}
                    >
                        <Text className="text-white font-bold text-center">
                            {creating ? "Creando..." : "Crear Wallet"}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView>
                    <Text className="text-center font-bold mt-4 text-secondary text-2xl">Cartera</Text>

                    <View className="flex-row justify-between mt-6 mb-4">
                        <View className="bg-gray-100 px-3 py-4 rounded-md elevation-md w-48">
                            <Text className="text-xl font-bold text-center">Saldo disponible</Text>
                            <Text className="text-center font-semibold text-green-600 text-xl">{parseFloat(wallet.saldo).toFixed(2)} $</Text>
                        </View>

                        <View className="bg-gray-100 px-3 py-4 rounded-md elevation-md w-44">
                            <Text className="text-xl font-bold text-center">Envios</Text>
                            <Text className="text-center font-semibold text-primary text-xl">8</Text>
                        </View>
                    </View>
                    
                    <Text className="font-bold text-2xl text-center text-secondary mt-4">Historial de transacciones</Text>

                    {wallet.movimientos?.length === 0 ? (
                        <Text className="text-gray-500 text-center mt-4">No hay movimientos aún</Text>
                    ) : (
                        wallet.movimientos?.map((mov) => (
                            <View
                                key={mov.id}
                                className="bg-gray-100 p-3 mb-2 rounded-lg flex-row justify-between"
                            >
                                <View>
                                    <Text className="font-semibold">{mov.descripcion}</Text>
                                    <Text className="text-gray-500 text-sm">
                                        {new Date(mov.creado_en).toLocaleString()}
                                    </Text>
                                </View>
                                <Text
                                    className={`font-bold ${parseFloat(mov.monto) >= 0 ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {parseFloat(mov.monto) >= 0
                                        ? `+${parseFloat(mov.monto).toFixed(2)}`
                                        : `${parseFloat(mov.monto).toFixed(2)}`}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
