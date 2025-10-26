import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function SeleccionarDireccion() {
  const router = useRouter();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 10.476,  // Default Guarenas
    longitude: -66.599,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // 🔹 Obtener ubicación inicial del dispositivo
  useEffect(() => {
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso denegado", "No se pudo acceder a tu ubicación");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;

        setLocation({ latitude, longitude });
        setRegion((prev) => ({ ...prev, latitude, longitude }));
      } catch (error) {
        console.log("Error obteniendo ubicación:", error);
      }
    };

    initLocation();
  }, []);

  const handlePress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (location) {
      router.push({
        pathname: "/perfil/formulario-direccion",
        params: { latitud: location.latitude, longitud: location.longitude },
      });
    } else {
      alert("Por favor selecciona un punto en el mapa");
    }
  };

  const handleCancel = () => {
    router.push('/(tabs)/perfil/formulario-direccion');
  };

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        region={region}
        onPress={handlePress}
        showsUserLocation
      >
        {location && <Marker coordinate={location} />}
      </MapView>

      <View className="absolute bottom-10 left-6 right-6 flex-row justify-between">
        <TouchableOpacity
          className="bg-gray-400 rounded-xl py-3 px-6 flex-1 mr-2"
          onPress={handleCancel}
        >
          <Text className="text-white text-center font-bold">Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-3 px-6 flex-1 ml-2"
          onPress={handleConfirm}
        >
          <Text className="text-white text-center font-bold">Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
