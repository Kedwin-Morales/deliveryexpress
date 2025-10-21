import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

// 🧩 Tipos
export type ExtraItem = {
  id: number;
  nombre: string;
  precio_adicional: number;
};

export type CarritoItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  cantidad: number;
  nombre_restaurante?: string;
  restauranteId?: string;
  descripcion?: string;
  precio_descuento?: number;
  extras?: ExtraItem[]; // 👈 NUEVO
};

export const useCarrito = () => {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🔹 Cargar carrito desde AsyncStorage
  const cargarCarrito = async () => {
    try {
      const data = await AsyncStorage.getItem("carrito");
      if (data) setCarrito(JSON.parse(data));
      else setCarrito([]);
    } catch (err) {
      console.log("Error cargando carrito:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarCarrito();
    }, [])
  );

  useEffect(() => {
    cargarCarrito();
  }, []);

  // 🔹 Guardar carrito automáticamente
  useEffect(() => {
    if (!isLoaded) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem("carrito", JSON.stringify(carrito));
      } catch (err) {
        console.log("Error guardando carrito:", err);
      }
    };
    save();
  }, [carrito, isLoaded]);

  // 🔹 Agregar plato (con validación de restaurante)
  const agregarAlCarrito = (
    plato: Omit<CarritoItem, "cantidad"> & { cantidad?: number }
  ) => {
    const restauranteActual = carrito[0]?.restauranteId;

    // ⚠️ Si ya hay productos de otro restaurante
    if (restauranteActual && restauranteActual !== plato.restauranteId) {
      Alert.alert(
        "Carrito de otro restaurante",
        "Tu carrito ya contiene productos de otro restaurante. ¿Deseas reemplazarlos?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Reemplazar",
            style: "destructive",
            onPress: () =>
              setCarrito([{ ...plato, cantidad: plato.cantidad ?? 1 }]),
          },
        ]
      );
      return;
    }

    // ✅ Si es del mismo restaurante o carrito vacío
    setCarrito((prev) => {
      // Buscar si el mismo plato con los mismos extras ya está
      const existe = prev.find(
        (p) =>
          p.id === plato.id &&
          JSON.stringify(p.extras) === JSON.stringify(plato.extras)
      );

      if (existe) {
        // Si ya existe, solo aumenta cantidad
        return prev.map((p) =>
          p.id === plato.id &&
          JSON.stringify(p.extras) === JSON.stringify(plato.extras)
            ? { ...p, cantidad: p.cantidad + (plato.cantidad ?? 1) }
            : p
        );
      }

      // Si no existe, agregar nuevo
      return [...prev, { ...plato, cantidad: plato.cantidad ?? 1 }];
    });
  };

  // 🔹 Reducir cantidad o eliminar si llega a 0
  const quitarDelCarrito = (platoId: string, extras?: ExtraItem[]) => {
    setCarrito((prev) =>
      prev
        .map((p) =>
          p.id === platoId &&
          JSON.stringify(p.extras) === JSON.stringify(extras)
            ? { ...p, cantidad: p.cantidad - 1 }
            : p
        )
        .filter((p) => p.cantidad > 0)
    );
  };

  // 🔹 Vaciar carrito
  const limpiarCarrito = () => {
    setCarrito([]);
    AsyncStorage.removeItem("carrito");
  };

  // 🔹 Calcular total
  const obtenerTotal = () => {
    return carrito.reduce((acc, p) => {
      const extrasTotal =
        p.extras?.reduce((sum, e) => sum + Number(e.precio_adicional), 0) || 0;
      const subtotal = (p.precio + extrasTotal) * p.cantidad;
      return acc + subtotal;
    }, 0);
  };

  return {
    carrito,
    agregarAlCarrito,
    quitarDelCarrito,
    limpiarCarrito,
    obtenerTotal,
  };
};
