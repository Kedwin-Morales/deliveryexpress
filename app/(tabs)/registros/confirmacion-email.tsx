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

export default function ConfirmacionEmail() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const token = user?.token;

  const [email, setEmail] = useState(user?.email || "");
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);

  const [cooldown, setCooldown] = useState(0);
  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
    setTimeout(() => setPopup((prev) => ({ ...prev, visible: false })), 3000);
  };

  // 🔹 Cooldown contador
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (text: string, index: number) => {
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < otp.length - 1) inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // 🔹 Enviar código OTP
  const handleEnviarCodigo = async () => {
    if (!email) return showPopup("Por favor ingresa tu correo electrónico", "warning");
    if (cooldown > 0) return;

    try {
      await axios.post(`${API_URL}/api/user/usuario/enviar-codigo/`, { metodo: "email" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showPopup("📧 Código enviado a tu correo electrónico", "check-circle");
      setCooldown(300); // 5 minutos
    } catch (err) {
      console.error(err);
      showPopup("Error al enviar el código. Intenta más tarde", "warning");
    }
  };

  // 🔹 Confirmar código OTP
  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) return showPopup("Por favor ingresa los 6 dígitos del código", "warning");

    try {
      await axios.post(`${API_URL}/api/user/usuario/verificar-codigo/`, { metodo: "email", codigo: code }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showPopup("✅ Correo verificado correctamente", "check-circle");
      router.replace("/(tabs)/registros/confirmacion-registro");
    } catch (err) {
      console.error(err);
      showPopup("Error al verificar el código", "warning");
    }
  };

  // 🔹 Guardar nuevo email
  const handleGuardarEmail = async () => {
    if (!email) return showPopup("Ingresa un correo válido", "warning");
    try {
      const resp = await axios.patch(
        `${API_URL}/api/user/usuario/${user?.$id}/`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.status === 200) {
        showPopup("✅ Correo actualizado correctamente", "check-circle");
        setUser({ ...user, email });
        setEditandoEmail(false);
      }
    } catch (err) {
      console.error(err);
      showPopup("Error al actualizar correo", "error-outline");
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
            <Image source={images.arrowBack} style={{ tintColor: "#003399", width: 20, height: 20 }} />
            <Text className="text-xl text-primary ml-2 font-bold">Atrás</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Título */}
      <Text className="text-center text-3xl font-extrabold text-secondary mt-4">
        Confirma tu Correo Electrónico
      </Text>
      <Text className="text-xl mx-8 font-semibold">
        Enviaremos un código a tu correo para confirmar la verificación.
      </Text>

      {/* Email */}
      <View className="mx-4 mt-4">
        <CustomInput
          placeholder="Tu correo electrónico"
          value={email}
          label="Correo electrónico"
          editable={editandoEmail}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          onPress={editandoEmail ? handleGuardarEmail : () => setEditandoEmail(true)}
          className="self-end mt-2"
        >
          <Text className="text-primary font-semibold">
            {editandoEmail ? "Guardar correo" : "Editar correo"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón enviar código */}
      <TouchableOpacity
        onPress={handleEnviarCodigo}
        disabled={cooldown > 0}
        className={`mx-10 py-3 rounded-xl ${cooldown > 0 ? "bg-gray-400" : "bg-secondary"}`}
      >
        <Text className="text-white font-bold text-center text-xl">
          {cooldown > 0 ? `Reintentar en ${formatTime(cooldown)}` : "Enviar Código"}
        </Text>
      </TouchableOpacity>

      {/* Cajas de código OTP */}
      <View className="flex-row justify-center mt-8 gap-3">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputs.current[index] = ref; }}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            className="w-12 h-14 bg-gray-200 rounded-xl text-center text-xl font-bold text-gray-800"
          />
        ))}
      </View>

      {/* Confirmar OTP */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-primary mx-10 py-3 rounded-xl mt-8"
      >
        <Text className="text-white font-bold text-center text-xl">Confirmar Código</Text>
      </TouchableOpacity>

      {/* Reenviar */}
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
