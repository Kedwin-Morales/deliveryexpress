import { View, Text, TouchableOpacity, Image, Dimensions, TextInput } from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { API_URL, images } from "@/constants";
import CustomInput from "@/components/CustomInput";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";
import PopupMessage from "@/components/PopupMessage";

export default function ConfirmacionTelefono() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const token = useAuthStore((state) => state.user?.token);

    const [telefono, setTelefono] = useState(user?.telefono || "");
    const [editandoTelefono, setEditandoTelefono] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputs = useRef<(TextInput | null)[]>([]);

    const [cooldown, setCooldown] = useState(0); // 🔹 Tiempo en segundos
    const [popup, setPopup] = useState({
        visible: false,
        message: "",
        icon: "info" as keyof typeof MaterialIcons.glyphMap,
    });

    const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
        setPopup({ visible: true, message, icon });
        setTimeout(() => setPopup((prev) => ({ ...prev, visible: false })), 3000);
    };

    // 🔹 Contador de cooldown
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleChange = (text: string, index: number) => {
        if (/^[0-9]?$/.test(text)) {
            const newOtp = [...otp];
            newOtp[index] = text;
            setOtp(newOtp);
            if (text && index < 5) inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async () => {
        const code = otp.join("");
        if (code.length < 6) return alert("Por favor ingresa los 6 dígitos del código.");

        try {
            const payload = { metodo: "telefono", codigo: code };
            await axios.post(`${API_URL}/api/user/usuario/verificar-codigo/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            showPopup("✅ Código verificado correctamente", "check-circle");
            router.replace("/(tabs)/registros/confirmacion-registro");
        } catch (err) {
            console.error(err);
            showPopup("Error al verificar el código", "warning");
        }
    };

    const handleGuardarTelefono = async () => {
        if (!telefono) return showPopup("Ingresa un número válido", "warning");

        try {
            const resp = await axios.patch(
                `${API_URL}/api/user/usuario/${user?.$id}/`,
                { telefono },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (resp.status === 200) {
                showPopup("✅ Número actualizado correctamente", "check-circle");
                setUser({ telefono });
                setEditandoTelefono(false);
            }
        } catch (err) {
            console.error("Error al actualizar teléfono:", err);
            showPopup("Error al actualizar número", "error-outline");
        }
    };

    const handleEnviarCodigo = async () => {
        if (!telefono) return showPopup("Por favor ingresa tu número de teléfono", "warning");
        if (cooldown > 0) return; // ⛔ evita que se reenvíe durante el cooldown

        try {
            const payload = { metodo: "telefono" };
            await axios.post(`${API_URL}/api/user/usuario/enviar-codigo/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            showPopup("📲 Código enviado a tu número de teléfono", "check-circle");
            setCooldown(300); // 🔹 5 minutos = 300 segundos
        } catch (err) {
            console.error(err);
            showPopup("Error al enviar el código. Intenta más tarde", "warning");
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <SafeAreaView className="flex-1 gap-5 bg-white">
            {/* Header */}
            <View className="w-full relative" style={{ height: Dimensions.get("screen").height / 14 }}>
                <View className="absolute top-8 left-5 z-10 flex-row items-center">
                    <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() => router.push("/registros/confirmacion-registro")}
                    >
                        <Image
                            source={images.arrowBack}
                            style={{ tintColor: "#003399", width: 20, height: 20 }}
                        />
                        <Text className="text-xl text-primary ml-2 font-bold">Atrás</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Título */}
            <Text className="text-center text-3xl font-extrabold text-secondary mt-4">
                Confirma tu Número de Teléfono
            </Text>

            <Text className="text-xl mx-8 font-semibold">
                Enviaremos un código a tu teléfono para confirmar la verificación.
            </Text>

            {/* Teléfono */}
            <View className="mx-4 mt-4">
                <CustomInput
                    placeholder="Tu número de teléfono"
                    value={telefono}
                    label="Número de teléfono"
                    editable={editandoTelefono}
                    onChangeText={setTelefono}
                />

                <TouchableOpacity
                    onPress={editandoTelefono ? handleGuardarTelefono : () => setEditandoTelefono(true)}
                    className="self-end mt-2"
                >
                    <Text className="text-primary font-semibold">
                        {editandoTelefono ? "Guardar número" : "Editar número"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Botón para enviar código */}
            <TouchableOpacity
                onPress={handleEnviarCodigo}
                disabled={cooldown > 0}
                className={`mx-10 py-3 rounded-xl ${cooldown > 0 ? "bg-gray-400" : "bg-secondary"
                    }`}
            >
                <Text className="text-white font-bold text-center text-xl">
                    {cooldown > 0
                        ? `Reintentar en ${formatTime(cooldown)}`
                        : "Enviar Código"}
                </Text>
            </TouchableOpacity>

            {/* Cajas de código */}
            <View className="flex-row justify-center mt-8 gap-3">
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {
                            inputs.current[index] = ref;
                        }}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        className="w-12 h-14 bg-gray-200 rounded-xl text-center text-xl font-bold text-gray-800"
                    />
                ))}
            </View>

            {/* Confirmar */}
            <TouchableOpacity onPress={handleSubmit} className="bg-primary mx-10 py-3 rounded-xl mt-8">
                <Text className="text-white font-bold text-center text-xl">Confirmar Código</Text>
            </TouchableOpacity>

            {/* Botón alternativo de reenvío */}
            {cooldown === 0 && (
                <TouchableOpacity onPress={handleEnviarCodigo} className="mt-4">
                    <Text className="text-center text-primary font-semibold text-lg">
                        ¿No recibiste el código? Reenviar
                    </Text>
                </TouchableOpacity>
            )}

            {/* Popup */}
            <PopupMessage
                visible={popup.visible}
                message={popup.message}
                icon={popup.icon}
                onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}
