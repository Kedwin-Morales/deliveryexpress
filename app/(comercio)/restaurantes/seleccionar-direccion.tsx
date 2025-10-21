import React, { useState, useEffect } from "react";
import { View, Dimensions, TouchableOpacity, Text } from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function MapaScreen() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const router = useRouter();

  // Coordenadas del restaurante de ejemplo
  const restaurantLocation = {
    latitude: -34.6017,
    longitude: -58.3820,
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Se necesita permiso de ubicación para usar el mapa.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const handleMapPress = (event: MapPressEvent) => {
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const handleAceptar = () => {
    if (!selectedLocation) return;
    router.push({
      pathname: "/(comercio)/restaurantes/registrar-restaurantes", // tu ruta
      params: {
        latitud: selectedLocation.latitude,
        longitud: selectedLocation.longitude,
      },
    });
  };

  const handleCancelar = () => {
    router.push("/(comercio)/restaurantes/registrar-restaurantes"); // sin params
  };

  if (!userLocation) return <View className="flex-1 bg-white" />;

  return (
    <View className="flex-1">
      <MapView
        style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height }}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {/* Usuario */}
        <Marker
          coordinate={userLocation}
          title="Tu ubicación"
          description="Ubicación actual"
          pinColor="blue"
        />

        {/* Selección */}
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Ubicación seleccionada"
            pinColor="green"
          />
        )}

        {/* Restaurante */}
        <Marker
          coordinate={restaurantLocation}
          title="Restaurante"
          description="Haz click para seleccionar"
          pinColor="red"
        />
      </MapView>

      {/* Botones flotantes */}
      <View className="absolute bottom-8 left-5 right-5 flex-row  justify-center gap-5">
        <TouchableOpacity
          className="bg-gray-500 px-6 py-3 rounded-lg"
          onPress={handleCancelar}
        >
          <Text className="text-white font-bold text-center">Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-secondary px-6 py-3 rounded-lg"
          onPress={handleAceptar}
        >
          <Text className="text-white font-bold text-center">Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
