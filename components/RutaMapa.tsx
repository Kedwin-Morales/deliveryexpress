// components/RutaMapaTiempoReal.tsx
import React, { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";

const GOOGLE_MAPS_APIKEY = "AIzaSyDGW53aLubZK0HAmlRi2x-FrgpuK6Ce2m8"; // ⚠️ Coloca tu API Key

export default function RutaMapaTiempoReal({
  ordenId,
  destino,
}: {
  ordenId: string;
  destino: { latitude: number; longitude: number };
}) {
  const { user } = useAuthStore();
  const [ubicacionConductor, setUbicacionConductor] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  // 🔄 Actualizar ubicación del conductor cada 5 s
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchUbicacion = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/ordenes/ordenes/${ordenId}/ubicacion-conductor/`,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        setUbicacionConductor({
          latitude: res.data.latitud,
          longitude: res.data.longitud,
        });
      } catch (err) {
        console.log("Error obteniendo ubicación del conductor:", err);
      }
    };

    fetchUbicacion();
    interval = setInterval(fetchUbicacion, 5000); // cada 5 s

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenId]);

  // Centrar mapa si cambia ubicación
  useEffect(() => {
    if (ubicacionConductor && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: ubicacionConductor.latitude,
        longitude: ubicacionConductor.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [ubicacionConductor]);

  if (!ubicacionConductor) return null;

  return (
    <View
      style={{
        height: 350,
        width: "100%",
        marginTop: 20,
        borderRadius: 15,
        overflow: "hidden",
      }}
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: ubicacionConductor.latitude,
          longitude: ubicacionConductor.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* 🚚 Conductor */}
        <Marker
          coordinate={ubicacionConductor}
          title="Conductor"
          pinColor="green"
        />

        {/* 📍 Cliente */}
        <Marker coordinate={destino} title="Destino" pinColor="red" />

        {/* 🛣️ Ruta */}
        <MapViewDirections
          origin={ubicacionConductor}
          destination={destino}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={4}
          strokeColor="blue"
        />
      </MapView>
    </View>
  );
}
