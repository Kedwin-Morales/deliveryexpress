import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCarrito } from "@/store/useCart";
import axios from "axios";
import { API_URL } from "@/constants";
import { Direccion, Estado, MetodosPagos } from "@/type";
import { useAuthStore } from "@/store/auth.store";
import CountryPicker from "react-native-country-picker-modal";
import PopupMessage from "@/components/PopupMessage";
import CustomButton from "@/components/CustomButton";

export default function PagoMovilModal() {
  const [referencia, setReferencia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const token = useAuthStore((state) => state.user?.token);
  const [metodosPago, setMetodosPago] = useState<MetodosPagos[]>([]);
  const { carrito, limpiarCarrito } = useCarrito();
  const router = useRouter();
  const [direccionPrincipal, setDireccionPrincipal] = useState<Direccion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { montoTotal } = useLocalSearchParams();

  // Convierte el monto a número y calcula en bolívares
const montoTotalNum = Number(montoTotal) || 0;
const montoEnBs = montoTotalNum * 160;


  // Country picker
  const [country, setCountry] = useState({
    cca2: "VE",
    callingCode: ["58"],
  });
  const [visible, setVisible] = useState(false);
  const onSelect = (countrySelected: any) => setCountry(countrySelected);

  // Popup
  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  const copiar = async (texto: string) => {
    await Clipboard.setStringAsync(texto);
  };

  const handleSubmit = async () => {
    if (!telefono || telefono.length < 7) {
      return showPopup("Debe ingresar un teléfono válido", "warning");
    }

    if (!referencia) {
      return showPopup("Debe ingresar la referencia del pago", "warning");
    }

    try {
    setIsSubmitting(true)
      const restauranteId = carrito;
      const detalles = carrito.map((item) => ({
        plato: item.id,
        cantidad: item.cantidad,
      }));

      

      const payload = {
        restaurante: restauranteId[0].restauranteId,
        estado: estado?.id,
        metodo_pago: metodosPago.find((x) => x.nombre === "Pago móvil")?.id,
        detalles,
        direccion_entrega: `${direccionPrincipal?.direccion_texto}`,
        latitud: direccionPrincipal?.latitud,
        longitud: direccionPrincipal?.longitud,
      };

      const res = await axios.post(`${API_URL}/api/ordenes/ordenes/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payloadPago = {
        orden: res.data.id,
        metodo: metodosPago.find((x) => x.nombre === "Pago móvil")?.id,
        monto_usd: res.data.total,
        tasa_cambio: "160.00",
        referencia,
        telefono_pago: `+${country.callingCode[0]}${telefono}`,
      };

      await axios.post(`${API_URL}/api/pagos/pagos/`, payloadPago, {
        headers: { Authorization: `Bearer ${token}` },
      }).finally(() => setIsSubmitting(false))

      

      limpiarCarrito();
      setReferencia("");
      setTelefono("");
      showPopup("Tu orden fue registrada correctamente", "check-circle");
      setTimeout(() => router.replace("/(tabs)"), 1200);
    } catch (err) {
      console.log("Error enviando el pago:", err);
      showPopup("No se pudo registrar el pago. Intenta nuevamente.", "cancel");
    }
  };

  const fecthEstatusOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstado(res.data.find((e: Estado) => e.nombre.toLowerCase() === "pago por verificar"));
    } catch (err) {
      console.log("Error obteniendo estados:", err);
    }
  };

  const fetchPagos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pagos/metodos-pago/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetodosPago(res.data);
    } catch (err) {
      console.log("Error obteniendo métodos de pago:", err);
    }
  };

  const fetchDireccionPrincipal = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const principal = res.data.find((d: Direccion) => d.es_predeterminada === true);
            setDireccionPrincipal(principal || null);
        } catch (err) {
            console.log("Error obteniendo direcciones:", err);
        }
    };


  useFocusEffect(
    useCallback(() => {
      fecthEstatusOrden();
      fetchPagos();
      fetchDireccionPrincipal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [carrito])
  );

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <ScrollView showsVerticalScrollIndicator={false} className="mb-6 mt-2">
        <View className="flex-row gap-2 justify-center mt-2">
          <MaterialCommunityIcons name="cellphone-check" size={24} color="#FF6600" />
          <Text className="text-2xl text-secondary font-extrabold text-center">Pago Móvil</Text>
        </View>

        <View className="p-4 rounded-lg bg-primary mt-6">
          <Text className="text-lg text-center font-bold text-white mb-3">Instrucciones</Text>
          <Text className="text-base text-white mb-1">1. Copia los datos de pago que aparecen abajo.</Text>
          <Text className="text-base text-white mb-1">2. Realiza el pago móvil desde tu banco.</Text>
          <Text className="text-base text-white mb-1">3. Guarda el número de referencia.</Text>
          <Text className="text-base text-white">4. Ingresa la referencia y el teléfono.</Text>
        </View>

        {/* Datos para el pago */}
        <View className="mt-4 gap-3">
          <Text className="font-bold text-xl text-secondary mb-1 text-center">
            Datos para realizar el pago:
          </Text>
          {[
            { label: "Teléfono", valor: "0412-1234567", icon: "call" },
            { label: "Cédula", valor: "V-12345678", icon: "person" },
            { label: "Banco", valor: "Banco de Venezuela", icon: "business" },
            { label: "Monto a pagar", valor: `Bs. ${montoEnBs}`, icon: "cash" },
          ].map((item) => (
            <View
              key={item.label}
              className="flex-row justify-between items-center py-3 bg-gray-300 px-3 rounded-md"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name={item.icon as any} size={22} color="#0033A0" />
                <View>
                  <Text className="text-gray-500 font-medium">{item.label}</Text>
                  <Text
                    className={`font-semibold text-lg ${
                      item.label === "Monto a pagar" ? "text-primary" : "text-black"
                    }`}
                  >
                    {item.valor}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => copiar(item.valor)}>
                <Ionicons name="copy-outline" size={22} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Teléfono desde donde hizo el pago */}
        <View className="mt-6">
          <Text className="font-semibold text-lg mb-2">Teléfono desde donde realizó el pago</Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center bg-gray-300 px-1 py-2 rounded-lg">
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
                className="bg-gray-300 rounded-lg px-4 py-3"
                placeholder="Ingresa tu número de teléfono"
                value={telefono}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  if (cleaned.length <= 10) setTelefono(cleaned);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Referencia */}
        <View className="mt-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="receipt-outline" size={24} color="#0033A0" />
            <Text className="ml-2 font-semibold text-lg">Referencia</Text>
          </View>
          <TextInput
            className="rounded-lg px-4 py-3 bg-gray-300"
            value={referencia}
            onChangeText={setReferencia}
            placeholder="Ingrese el número de referencia"
            keyboardType="numeric"
          />
        </View>

        <CustomButton
          title="Confirmar"
          style='bg-secondary mt-4'
          isLoading={isSubmitting}
          onPress={handleSubmit}
        />

        <TouchableOpacity
          className="py-3 px-6 self-center mt-2"
          onPress={() => router.push("/cart")}
        >
          <Text className="text-primary text-lg font-semibold">Cancelar</Text>
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
