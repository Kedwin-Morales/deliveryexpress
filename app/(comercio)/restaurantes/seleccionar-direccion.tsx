import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, MapPressEvent, UrlTile, MarkerDragStartEndEvent } from "react-native-maps";
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

  // Cuando el usuario toca el mapa, colocamos el marcador
  const handlePress = (event: MapPressEvent) => {
    const coord = event.nativeEvent?.coordinate;
    if (coord?.latitude && coord?.longitude) {
      setLocation({ latitude: coord.latitude, longitude: coord.longitude });
    }
  };

  // Cuando el usuario arrastra el marcador
  const handleDragEnd = (event: MarkerDragStartEndEvent) => {
  const coord = event.nativeEvent.coordinate;
  setLocation({ latitude: coord.latitude, longitude: coord.longitude });
};

  const handleConfirm = () => {
    if (location) {
      router.push({
        pathname: "/restaurantes/registrar-restaurantes",
        params: { latitud: location.latitude, longitud: location.longitude },
      });
    } else {
      alert("Por favor selecciona un punto en el mapa");
    }
  };

  const handleCancel = () => {
    router.push("/restaurantes/registrar-restaurantes");
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={defaultRegion}
        onPress={handlePress}
      >
        {/* Tile de OpenStreetMap */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />

        {location && (
          <Marker
            coordinate={location}
            draggable // marcador arrastrable
            onDragEnd={handleDragEnd} // actualizar coordenadas al moverlo
          />
        )}
      </MapView>

      <View style={{ position: "absolute", bottom: 10, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity
          style={{ backgroundColor: "#9CA3AF", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, flex: 1, marginRight: 8 }}
          onPress={handleCancel}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: "#2563EB", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, flex: 1, marginLeft: 8 }}
          onPress={handleConfirm}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
