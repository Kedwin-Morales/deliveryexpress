import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCarrito } from "@/store/useCart";
import { API_URL, images } from "@/constants";
import { useCallback, useEffect, useState } from "react";
import { Direccion, Estado, MetodosPagos } from "@/type";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import PopupMessage from "@/components/PopupMessage";

const Cart = () => {
  const router = useRouter();
  const { carrito, quitarDelCarrito, limpiarCarrito, agregarAlCarrito } =
    useCarrito();
  const token = useAuthStore((state) => state.user?.token);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [costoEnvio, setCostoEnvio] = useState(0);

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [impuesto, setImpuesto] = useState(0);

  const [metodosPago, setMetodosPago] = useState<MetodosPagos[]>([]);
  const [metodo, setMetodo] = useState<MetodosPagos | null>(null);
  const [direccionPrincipal, setDireccionPrincipal] =
    useState<Direccion | null>(null);

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (
    message: string,
    icon: keyof typeof MaterialIcons.glyphMap = "info"
  ) => {
    setPopup({ visible: true, message, icon });
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
      const principal = res.data.find(
        (d: Direccion) => d.es_predeterminada === true
      );
      setDireccionPrincipal(principal || null);
    } catch (err) {
      console.log("Error obteniendo direcciones:", err);
    }
  };

  const fecthEstatusOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstado(
        res.data.find((e: Estado) => e.nombre.toLowerCase() === "pendiente")
      );
    } catch (err) {
      console.log("Error obteniendo estado de orden:", err);
    }
  };

  /** ✅ Calcular costo de envío usando coordenadas reales del restaurante */
  const calcularCostoEnvio = async () => {
    try {
      if (!direccionPrincipal || carrito.length === 0) return;

      const restauranteId = carrito[0].restauranteId;
      if (!restauranteId) return;

      const resRestaurante = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${restauranteId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const restaurante = resRestaurante.data;

      if (!restaurante.latitud || !restaurante.longitud) {
        console.warn("El restaurante no tiene coordenadas válidas");
        return;
      }

      const origen = {
        latitude: restaurante.latitud,
        longitude: restaurante.longitud,
      };
      const destino = {
        latitude: direccionPrincipal.latitud,
        longitude: direccionPrincipal.longitud,
      };

      const url = `https://maps.deliveryexpressfast.store/route/v1/driving/${origen.longitude},${origen.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`;

      const res = await axios.get(url);
      const distanciaMetros = res.data.routes[0].distance;
      const distanciaKm = distanciaMetros / 1000;

      let costo = distanciaKm <= 1 ? 1 : 1 + (distanciaKm - 1) * 0.45;

      setCostoEnvio(parseFloat(costo.toFixed(2)));
      calcularTotales(costo);
    } catch (err) {
      showPopup("No se pudo calcular el costo de envío", "cancel");
    }
  };

  /** 🧮 Calcular totales (incluyendo extras) */
  const calcularTotales = (costo = costoEnvio) => {
    const newSubtotal = carrito.reduce((acc, item) => {
      const base = Number(item.precio);
      const extrasTotal =
        item.extras?.reduce(
          (sum, e) => sum + Number(e.precio_adicional || 0),
          0
        ) || 0;
      return acc + (base + extrasTotal) * item.cantidad;
    }, 0);

    const newImpuesto = newSubtotal * 0.16;
    const newTotal = newSubtotal + newImpuesto + costo;

    setSubtotal(parseFloat(newSubtotal.toFixed(2)));
    setImpuesto(parseFloat(newImpuesto.toFixed(2)));
    setTotal(parseFloat(newTotal.toFixed(2)));
  };

  useFocusEffect(
    useCallback(() => {
      fetchPagos();
      fetchDireccionPrincipal();
      fecthEstatusOrden();
      calcularCostoEnvio();
    }, [])
  );

  useEffect(() => {
    if (direccionPrincipal && carrito.length > 0) {
      calcularCostoEnvio();
    }
  }, [direccionPrincipal, carrito]);

  /** ✅ Enviar orden al backend */
  const handledSubmit = async () => {
    try {
      if (!metodo || carrito.length === 0) return;

      if (metodo.nombre === "Pago móvil") {
        router.push({
          pathname: "/orden/pago-movil",
          params: { montoTotal: total.toFixed(2) },
        });

        return;
      }

      const detalles = carrito.map((item) => ({
        plato: item.id,
        cantidad: item.cantidad,
        extras:
          item.extras?.map((e) => ({
            id: e.id,
            nombre: e.nombre,
            precio_adicional: e.precio_adicional,
          })) || [],
      }));

      const payload = {
        restaurante: carrito[0].restauranteId,
        estado: estado?.id,
        metodo_pago: metodo.id,
        direccion_entrega: `${direccionPrincipal?.direccion_texto}`,
        latitud: direccionPrincipal?.latitud,
        longitud: direccionPrincipal?.longitud,
        detalles,
      };

      console.log(payload.detalles[0].extras)

      const res = await axios.post(`${API_URL}/api/ordenes/ordenes/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payloadPago = {
        orden: res.data.id,
        metodo: metodo.id,
        monto_usd: res.data.total,
      };

      await axios.post(`${API_URL}/api/pagos/pagos/`, payloadPago, {
        headers: { Authorization: `Bearer ${token}` },
      });

      limpiarCarrito();
      showPopup("Tu orden fue registrada correctamente", "check-circle");
      setMetodo(null);
      setTimeout(() => router.replace("/(tabs)"), 2000);
    } catch (err) {
      console.log("Error al procesar la orden:", err);
    }
  };

  const seleccionarMetodo = (op: any) => {
    setMetodo(op);
    setModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 flex-row">
              <Ionicons name="arrow-back" size={22} color="#003399" />
              <Text className="text-xl font-bold text-primary">Atrás</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")} className="items-center mr-4">
            <Ionicons name="notifications" size={32} color="#FF6600" />
          </TouchableOpacity>
        </View>

        <Text className="text-secondary font-extrabold text-center text-3xl mb-2">
          Mi Carrito
        </Text>

        {/* Lista de productos */}
        {carrito.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="cart-outline" size={64} color="gray" />
            <Text className="text-gray-500 mt-2">Tu carrito está vacío</Text>
          </View>
        ) : (
          <View>
            <FlatList
              data={carrito}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 16, padding: 16 }}
              renderItem={({ item }) => {
                const totalExtras = item.extras?.reduce(
                  (sum, e) => sum + Number(e.precio_adicional || 0),
                  0
                ) ?? 0;
                const totalItem = (Number(item.precio) + totalExtras) * item.cantidad;

                return (
                  <View className="bg-gray-100 rounded-2xl p-4 elevation-md overflow-hidden flex-row">
                    <Image
                      source={item.imagen ? { uri: item.imagen } : images.avatar}
                      className="w-2/5 rounded-2xl"
                      resizeMode="cover"
                    />
                    <View className="p-4 w-2/3">
                      <Text className="text-base font-extrabold text-gray-800 mb-1">
                        {item.nombre}
                      </Text>

                      {item.extras && item.extras.length > 0 && (
                        <View className="mb-2">
                          {item.extras.map((extra, index) => (
                            <Text key={index} className="text-sm text-gray-500">
                              • {extra.nombre}{" "}
                              {extra.precio_adicional > 0
                                ? `(+${extra.precio_adicional}$)`
                                : ""}
                            </Text>
                          ))}
                        </View>
                      )}

                      <View className="flex-row justify-between items-center">
                        <Text className="text-base font-bold text-primary">
                          ${totalItem.toFixed(2)}
                        </Text>

                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity
                            onPress={() =>
                              agregarAlCarrito({ ...item, cantidad: 1 })
                            }
                            className="border border-primary px-3 py-1 rounded-full"
                          >
                            <Text className="text-lg font-bold text-primary">+</Text>
                          </TouchableOpacity>

                          <Text className="text-base font-bold">
                            {item.cantidad}
                          </Text>

                          <TouchableOpacity
                            onPress={() => quitarDelCarrito(item.id.toString())}
                            className="px-3 py-1 rounded-full border border-primary"
                          >
                            <Text className="text-lg font-bold text-primary">-</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {/* Resumen */}
            <View className="mx-4 mt-4 bg-gray-100 rounded-2xl elevation-md p-4">
              <Text className="text-xl font-extrabold">Detalles del pedido</Text>
              <View className="flex-row justify-between mt-2">
                <Text className="text-base">Subtotal</Text>
                <Text className="text-base">{subtotal.toFixed(2)}$</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-base">Envío</Text>
                <Text className="text-base text-primary font-bold">
                  {costoEnvio}$
                </Text>
              </View>
              <View className="flex-row justify-between mt-2 pb-2">
                <Text className="text-base">Impuestos</Text>
                <Text className="text-base">{impuesto.toFixed(2)}$</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-lg font-bold">Total</Text>
                <Text className="text-lg font-bold">{total.toFixed(2)}$</Text>
              </View>
            </View>

            {/* Método de pago */}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className={`flex-row items-center justify-center py-4 rounded-xl mx-4 mt-8 ${
                metodo ? "bg-[#FF6900]" : "bg-primary"
              }`}
            >
              <Text className="text-xl text-center text-white font-bold">
                {metodo ? metodo.nombre : "Seleccionar método de pago"}
              </Text>
            </TouchableOpacity>

            {/* Modal de métodos */}
            <Modal
              visible={modalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setModalVisible(false)}
            >
              <View className="flex-1 justify-center bg-black/50">
                <View className="bg-primary rounded-t-2xl p-4 mx-4">
                  <Text className="text-lg font-bold mb-3 text-center text-white">
                    Selecciona un método de pago
                  </Text>

                  {metodosPago.map((op) => (
                    <TouchableOpacity
                      key={op.id}
                      onPress={() => seleccionarMetodo(op)}
                      className="flex-row items-center justify-between p-3 rounded-xl bg-gray-100 mb-4"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name={op?.icons as any} size={22} color="#555" />
                        <Text className="ml-3 text-base font-semibold text-gray-800">
                          {op.nombre}
                        </Text>
                      </View>

                      {metodo?.id === op.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#FF6900"
                        />
                      )}
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="mt-4 py-3 bg-gray-200 rounded-xl items-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Footer */}
            <View className="mt-6 px-16 mb-4">
              <TouchableOpacity
                className={`py-4 rounded-xl items-center ${
                  direccionPrincipal && metodo ? "bg-secondary" : "bg-gray-200"
                }`}
                onPress={handledSubmit}
                disabled={!direccionPrincipal}
              >
                <Text className="text-white text-lg font-semibold">
                  Pagar {total.toFixed(2)}$
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="mt-4" onPress={limpiarCarrito}>
                <Text className="text-center font-semibold text-lg text-primary">
                  Cancelar Pedido
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
};

export default Cart;
