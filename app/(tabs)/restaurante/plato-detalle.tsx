import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Plato, Restaurante } from '@/type';
import axios from 'axios';
import { API_URL } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCarrito } from '@/store/useCart';

export default function PlatoDetalle() {
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);
  const [plato, setPlato] = useState<Plato>()
  const [restaurante, setRestaurante] = useState<Restaurante>()
  const [isFavorite, setIsFavorite] = useState(false);
  const [descuento, setDescuento] = useState<number>(0);
  const { agregarAlCarrito } = useCarrito();

  // 🔹 Estados para selects
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  const router = useRouter();

  const fetchPlato = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/platos/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resRestaurante = await axios.get(`${API_URL}/api/restaurantes/restaurantes/${res.data.restaurante}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRestaurante(resRestaurante.data);
      setPlato(res.data);
      setDescuento(res.data?.precio_descuento ? ((res.data?.precio - res.data?.precio_descuento) / res.data.precio) * 100 : 0);

      console.log(res.data.precio - res.data.precio_descuento);
    } catch (err) {
      console.log('Error obteniendo plato:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlato();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  // 🔹 Datos planos
  const sizes = [
    { name: "small", label: "Pequeño", price: 0 },
    { name: "medium", label: "Mediano", price: 2 },
    { name: "large", label: "Grande", price: 4 },
  ];

  const extras = [
    { name: "queso", label: "Queso extra", price: 1 },
    { name: "salsa", label: "Salsa adicional", price: 0.5 },
    { name: "papas", label: "Papas fritas", price: 2 },
  ];

  const toggleExtra = (extra: string) => {
    if (selectedExtras.includes(extra)) {
      setSelectedExtras(selectedExtras.filter(e => e !== extra));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  // 🔹 Calcular total
  const calculateTotalPrice = () => {
    if (!plato) return 0;

    const base = plato.precio_descuento ?? plato.precio;
    const sizePrice = sizes.find(s => s.name === selectedSize)?.price ?? 0;
    const extrasPrice = selectedExtras.reduce((sum, e) => {
      const extra = extras.find(ex => ex.name === e);
      return sum + (extra?.price ?? 0);
    }, 0);

    return (base + sizePrice + extrasPrice) * quantity;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 🔹 Header */}
      <View className="flex-row items-center px-4 py-3 bg-white justify-between ">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="mr-3 flex-row">
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary">Atrás</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setIsFavorite(!isFavorite)}
          className="p-2 rounded-full bg-gray-50"
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "red" : "black"}
          />
        </TouchableOpacity>
      </View>
      {/* 🔹 Contenido */}
      <ScrollView className="flex-1 mb-24">
        {/* Imagen */}
        <View className='relative'>
          <Image className="h-56 mx-4 rounded-t-xl" source={{ uri: plato?.imagen }} />
          {descuento > 0 && (
            <View className="absolute top-3 left-3 bg-secondary px-3 py-1 rounded-md">
              <Text className="text-white font-semibold text-sm">
                {descuento.toFixed(0)}% descuento
              </Text>
            </View>
          )}
        </View>

        {/* Info plato */}
        <View className="p-4">
          <View className='flex-row justify-between'>
            <Text className='text-xl font-extrabold'>{plato?.nombre}</Text>
            <View className='flex-row gap-2'>
              <Text className='font-bold text-xl text-primary'>{plato?.precio_descuento ?? plato?.precio}$</Text>
              {plato?.precio_descuento && (
                <Text className='text-lg text-gray-600 line-through'>$ {plato?.precio}$</Text>
              )}
            </View>
          </View>

          <Text className='text-lg font-bold mt-2'>Detalles</Text>

          <Text>
            {plato?.descripcion}
          </Text>
        </View>

        {/* 🔹 Tamaños */}
        <View className="px-4 mt-4">
          <Text className="text-lg font-extrabold text-secondary mb-2">Tamaño</Text>
          {sizes.map((size) => (
            <TouchableOpacity
              key={size.name}
              onPress={() => setSelectedSize(size.name)}
              className={`p-3 rounded-xl mb-4 border
                ${selectedSize === size.name ? "bg-primary/10 border-primary" : "bg-gray-200 border-gray-200 elevation-sm"}`}
            >
              <View className="flex-row justify-between items-center">
                <Text className={`font-bold ${selectedSize === size.name ? "text-primary" : "text-gray-900"}`}>{size.label}</Text>
                {size.price > 0 && (
                  <Text className="text-primary font-bold">+{size.price}$</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔹 Extras */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-extrabold text-secondary mb-2">Extras</Text>
          {extras.map((extra) => {
            const isSelected = selectedExtras.includes(extra.name);

            return (
              <TouchableOpacity
                key={extra.name}
                onPress={() => toggleExtra(extra.name)}
                className={`p-3 rounded-xl mb-4 border
          ${isSelected ? "bg-primary/10 border-primary" : "bg-gray-200 border-gray-200 elevation-sm"}`}
              >
                <View className="flex-row justify-between items-center">
                  <Text className={`font-bold ${isSelected ? "text-primary" : "text-gray-900"}`}>
                    {extra.label}
                  </Text>
                  <Text className="text-primary font-bold">+{extra.price}$</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 🔹 Fixed Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-4">
        <View className="flex-row items-center gap-4">
          {/* Quantity Controls */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-10 w-10 rounded-full border border-gray-300 items-center justify-center"
            >
              <Text className="text-xl">-</Text>
            </TouchableOpacity>

            <Text className="font-bold text-lg w-12 text-center">{quantity}</Text>

            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              className="h-10 w-10 rounded-full border border-gray-300 items-center justify-center"
            >
              <Text className="text-xl">+</Text>
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={() => {
              agregarAlCarrito({
                id: plato?.id?.toString() ?? "",
                nombre: plato?.nombre ?? "",
                precio: plato?.precio ?? 0,
                imagen: plato?.imagen ?? "",
                nombre_restaurante: restaurante?.nombre || "",
                cantidad: quantity,
                restauranteId: restaurante?.id || "",
              });

              router.back()
            }}
            className="flex-1 h-12 bg-primary rounded-full items-center justify-center"
          >
            <Text className="text-white font-bold text-lg">
              Agregar ${calculateTotalPrice().toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}
