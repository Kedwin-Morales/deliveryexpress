import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export type CarritoItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  cantidad: number;
  nombre_restaurante?: string;
  restauranteId?: string; // 👈 clave para validar
  descripcion? :string;
  precio_descuento?: number;
};

export const useCarrito = () => {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🔹 Cargar carrito desde AsyncStorage
  const cargarCarrito = async () => {
    try {
      const data = await AsyncStorage.getItem("carrito");
      if (data) {
        setCarrito(JSON.parse(data));
      } else {
        setCarrito([]);
      }
    } catch (err) {
      console.log("Error cargando carrito:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarCarrito();
    }, [])
  );

  useEffect(() => {
    const cargarCarrito = async () => {
      try {
        const data = await AsyncStorage.getItem("carrito");
        if (data) setCarrito(JSON.parse(data));
      } catch (err) {
        console.log("Error cargando carrito:", err);
      } finally {
        setIsLoaded(true);
      }
    };
    cargarCarrito();
  }, []);

  // 🔹 Guardar carrito cada vez que cambie
  useEffect(() => {
    if (!isLoaded) return; // 👈 evita sobrescribir con []
    const save = async () => {
      try {
        await AsyncStorage.setItem("carrito", JSON.stringify(carrito));
      } catch (err) {
        console.log("Error guardando carrito:", err);
      }
    };
    save();
  }, [carrito, isLoaded]);

  // 🔹 Agregar producto (con validación restaurante)
  const agregarAlCarrito = (
    plato: Omit<CarritoItem, "cantidad"> & { cantidad?: number }
  ) => {
    const restauranteActual = carrito[0]?.restauranteId;

    if (
      restauranteActual &&
      restauranteActual !== plato.restauranteId // ⚠️ Restaurante distinto
    ) {
      Alert.alert(
        "Restaurante distinto",
        "Tu carrito ya tiene platos de otro restaurante. ¿Quieres reemplazarlos?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sí, reemplazar",
            style: "destructive",
            onPress: () => {
              setCarrito([
                { ...plato, cantidad: plato.cantidad ?? 1 },
              ]);
            },
          },
        ]
      );
      return;
    }

    // ✅ Si es el mismo restaurante (o carrito vacío)
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === plato.id);
      if (existe) {
        return prev.map((p) =>
          p.id === plato.id
            ? { ...p, cantidad: p.cantidad + (plato.cantidad ?? 1) }
            : p
        );
      }
      return [...prev, { ...plato, cantidad: plato.cantidad ?? 1 }];
    });
  };

  // 🔹 Reducir producto
  const quitarDelCarrito = (platoId: string) => {
    setCarrito((prev) =>
      prev
        .map((p) =>
          p.id === platoId ? { ...p, cantidad: p.cantidad - 1 } : p
        )
        .filter((p) => p.cantidad > 0)
    );
  };

  // 🔹 Vaciar carrito
  const limpiarCarrito = () => setCarrito([]);

  return { carrito, agregarAlCarrito, quitarDelCarrito, limpiarCarrito };
};
