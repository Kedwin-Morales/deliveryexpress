import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fontisto, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Orden } from "@/type";

export default function MapaDireccion() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);

  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ubicacionConductor, setUbicacionConductor] = useState<{ latitud: number; longitud: number } | null>(null);

  const mapRef = useRef<MapView>(null);
  const GOOGLE_MAPS_APIKEY = "AIzaSyDGW53aLubZK0HAmlRi2x-FrgpuK6Ce2m8";

  // 📦 Obtener información de la orden
  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setOrden({
        ...data,
        latitud: Number(data.latitud),
        longitud: Number(data.longitud),
      });
    } catch (err) {
      console.log("Error obteniendo orden:", err);
    }
  };

  // 🚴‍♂️ Obtener ubicación del conductor
  const fetchUbicacionConductor = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/ubicacion-conductor/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && res.data.latitud && res.data.longitud) {
        setUbicacionConductor({
          latitud: Number(res.data.latitud),
          longitud: Number(res.data.longitud),
        });
      }
    } catch (err) {
      console.log("Error obteniendo ubicación del conductor:", err);
    }
  };

  // 🔁 Actualizar datos cada 30s
  useEffect(() => {
    fetchOrden();
    fetchUbicacionConductor();

    const interval = setInterval(() => {
      fetchUbicacionConductor();
    }, 30000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (orden && ubicacionConductor) setLoading(false);
  }, [orden, ubicacionConductor]);

  if (!orden) return null;

  const destino = {
    latitude: Number(orden.latitud),
    longitude: Number(orden.longitud),
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/profile")}
            className="mr-3 flex-row items-center"
          >
            <Ionicons name="arrow-back" size={22} color="#003399" />
            <Text className="text-xl font-bold text-primary ml-1">Atrás</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-secondary mx-6 mt-2 font-bold text-2xl">
        Mira el trayecto de tu comida 🍔
      </Text>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#003399" />
          <Text className="text-gray-500 mt-3">Cargando mapa...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={{ flex: 1, marginTop: 10 }}
          provider={PROVIDER_GOOGLE}
          showsCompass={true}
        >
          {/* 📍 Conductor */}
          {ubicacionConductor && (
            <Marker
              coordinate={{
                latitude: ubicacionConductor.latitud,
                longitude: ubicacionConductor.longitud,
              }}
              title="Repartidor"
              description="Ubicación actual del conductor"
            >
              <Fontisto name="motorcycle" size={36} color="#003399" />
            </Marker>
          )}

          {/* 🎯 Destino */}
          {destino.latitude && destino.longitude && (
            <Marker
              coordinate={destino}
              title="Destino"
              description="Dirección de entrega"
              pinColor="red"
            />
          )}

          {/* 🗺️ Ruta */}
          {ubicacionConductor && destino.latitude && destino.longitude && (
            <MapViewDirections
              origin={{
                latitude: ubicacionConductor.latitud,
                longitude: ubicacionConductor.longitud,
              }}
              destination={destino}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={4}
              strokeColor="#003399"
              onError={(err) => console.log("Error en Directions:", err)}
              onReady={(result) => {
                // 👇 centra el mapa con zoom en la ruta
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    top: 80,
                    right: 40,
                    bottom: 80,
                    left: 40,
                  },
                  animated: true,
                });
              }}
            />
          )}
        </MapView>
      )}
    </SafeAreaView>
  );
}
