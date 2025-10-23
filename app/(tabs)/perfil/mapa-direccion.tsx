import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  const GOOGLE_MAPS_APIKEY = "AIzaSyDGW53aLubZK0HAmlRi2x-FrgpuK6Ce2m8";

  // 📦 Obtener información de la orden
  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrden(res.data);
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
          latitud: parseFloat(res.data.latitud),
          longitud: parseFloat(res.data.longitud),
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

  // 🗺️ Coordenadas para renderizar mapa
  const latitudEntrega = orden?.latitud;
  const longitudEntrega = orden?.longitud;

  const destino = {
    latitude: latitudEntrega || 0,
    longitude: longitudEntrega || 0,
  };

  const region = {
    latitude: ubicacionConductor?.latitud || destino.latitude,
    longitude: ubicacionConductor?.longitud || destino.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/profile')}
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
          style={{ flex: 1, marginTop: 10 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          region={region}
          showsUserLocation={false}
          showsCompass={true}
        >
          {/* 📍 Marcador del Conductor */}
          {ubicacionConductor && (
            <Marker
              coordinate={{
                latitude: ubicacionConductor.latitud,
                longitude: ubicacionConductor.longitud,
              }}
              title="Repartidor"
              description="Ubicación actual del conductor"
              pinColor="blue"
            />
          )}

          {/* 🎯 Marcador del destino */}
          {latitudEntrega && longitudEntrega && (
            <Marker
              coordinate={destino}
              title="Destino"
              description="Dirección de entrega"
              pinColor="red"
            />
          )}

          {/* 🗺️ Dirección entre ambos puntos */}
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
              lineDashPattern={[0]}
              onError={(err) => console.log("Error en Directions:", err)}
            />
          )}
        </MapView>
      )}
    </SafeAreaView>
  );
}
