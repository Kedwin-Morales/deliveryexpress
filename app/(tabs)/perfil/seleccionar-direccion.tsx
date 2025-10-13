import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { useRouter } from "expo-router";

export default function SeleccionarDireccion() {
  const router = useRouter();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Región inicial → Guarenas
  const defaultRegion = {
    latitude: 10.476,
    longitude: -66.599,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Cuando el usuario toca el mapa, guardamos el punto
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
    router.push('/(tabs)/perfil/formulario-direccion'); // 👈 Volvemos sin cambiar nada
  };

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        initialRegion={defaultRegion}
        onPress={handlePress}
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
