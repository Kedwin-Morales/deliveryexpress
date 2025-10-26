import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { Plato, Restaurante } from "@/type";
import axios from "axios";
import { API_URL } from "@/constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCarrito } from "@/store/useCart";

export default function PlatoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.user?.token);
  const [plato, setPlato] = useState<Plato>();
  const [restaurante, setRestaurante] = useState<Restaurante>();
  const [tiposOpciones, setTiposOpciones] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { agregarAlCarrito } = useCarrito();
  const router = useRouter();

  const fetchPlato = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/platos/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlato(res.data);
      setTiposOpciones(res.data.tipos_opciones || []);

      const restauranteRes = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${res.data.restaurante}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurante(restauranteRes.data);
    } catch (err) {
      console.log("Error obteniendo plato o tipos:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlato();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  // Estado de selecciones por tipo
  const [selecciones, setSelecciones] = useState<Record<string, number[]>>({});

  const toggleOpcion = (tipoId: number, opcionId: number, multiple: boolean) => {
    setSelecciones((prev) => {
      const current = prev[tipoId] || [];
      if (multiple) {
        return current.includes(opcionId)
          ? { ...prev, [tipoId]: current.filter((id) => id !== opcionId) }
          : { ...prev, [tipoId]: [...current, opcionId] };
      } else {
        return { ...prev, [tipoId]: [opcionId] };
      }
    });
  };

  const calculateTotal = () => {
    if (!plato) return 0;
    const base = Number(plato.precio_descuento ?? plato.precio) || 0;
    let extras = 0;

    tiposOpciones.forEach((tipo) => {
      const seleccionadas = selecciones[tipo.id] || [];
      seleccionadas.forEach((opId) => {
        const op = tipo.opciones.find((o: any) => o.id === opId);
        if (op) extras += Number(op.precio_adicional) || 0;
      });
    });

    return (base + extras) * quantity;
  };

  const handleAddToCart = () => {
    const faltantes = tiposOpciones.filter(
      (tipo) => tipo.obligatorio && (!selecciones[tipo.id] || selecciones[tipo.id].length === 0)
    );

    if (faltantes.length > 0) {
      alert(
        `Debes seleccionar al menos una opción en: ${faltantes
          .map((f) => f.nombre)
          .join(", ")}`
      );
      return;
    }

    const extrasSeleccionados = tiposOpciones.flatMap((tipo) => {
      const seleccionadas = selecciones[tipo.id] || [];
      return tipo.opciones.filter((op: any) => seleccionadas.includes(op.id));
    });

    agregarAlCarrito({
      id: plato?.id?.toString() ?? "",
      nombre: plato?.nombre ?? "",
      precio: Number(plato?.precio_descuento ?? plato?.precio ?? 0),
      imagen: plato?.imagen ?? "",
      nombre_restaurante: restaurante?.nombre || "",
      cantidad: quantity,
      restauranteId: restaurante?.id || "",
      extras: extrasSeleccionados.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        precio_adicional: Number(e.precio_adicional),
      })),
    });

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={22} color="#003399" />
          <Text className="text-primary font-bold ml-2 text-lg">Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsFavorite(!isFavorite)}
          className="p-2 rounded-full bg-gray-100"
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "red" : "black"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 mb-24 px-4">
        {/* Imagen */}
        <Image
          source={{ uri: plato?.imagen }}
          className="w-full h-56 rounded-2xl mb-4"
        />

        {/* Info principal */}
        <View className="flex-row justify-between">
          <Text className="text-2xl font-extrabold w-3/4">{plato?.nombre}</Text>
          <Text className="text-xl font-bold text-primary">
            {plato?.precio_descuento ?? plato?.precio} $
          </Text>
        </View>
        <Text className="text-xl font-semibold mt-2">Detalles</Text>
        <Text className="text-lg mb-4">{plato?.descripcion}</Text>

        {/* Opciones dinámicas */}
        {tiposOpciones.map((tipo) => (
          <View key={tipo.id} className="mb-6">
            <Text className="text-lg font-extrabold text-secondary mb-2">{tipo.nombre}</Text>

            {tipo.opciones.map((op: any) => {
              const seleccionadas = selecciones[tipo.id] || [];
              const isSelected = seleccionadas.includes(op.id);

              return (
                <TouchableOpacity
                  key={op.id}
                  onPress={() => toggleOpcion(tipo.id, op.id, tipo.multiple)}
                  className={`p-3 rounded-xl mb-2 border ${
                    isSelected ? "bg-primary/10 border-primary" : "bg-gray-100 border-gray-200"
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className={`font-bold ${isSelected ? "text-primary" : "text-gray-900"}`}>
                      {op.nombre}
                    </Text>
                    {op.precio_adicional > 0 && (
                      <Text className="text-primary font-bold">+{op.precio_adicional}$</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Barra inferior */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex-row items-center gap-4">
        {/* Cantidad */}
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            className="h-10 w-10 rounded-full border border-gray-300 items-center justify-center"
          >
            <Text className="text-xl">-</Text>
          </TouchableOpacity>

          <Text className="w-10 text-center font-bold">{quantity}</Text>

          <TouchableOpacity
            onPress={() => setQuantity(quantity + 1)}
            className="h-10 w-10 rounded-full border border-gray-300 items-center justify-center"
          >
            <Text className="text-xl">+</Text>
          </TouchableOpacity>
        </View>

        {/* Botón agregar */}
        <TouchableOpacity
          onPress={handleAddToCart}
          className="flex-1 bg-primary rounded-full py-3 items-center justify-center"
        >
          <Text className="text-white font-bold text-lg">
            Agregar ${calculateTotal().toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
