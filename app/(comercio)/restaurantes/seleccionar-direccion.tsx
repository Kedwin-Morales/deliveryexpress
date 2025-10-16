// import { useState } from "react";
// import { View, Text, TouchableOpacity } from "react-native";
// import MapView, { Marker, MapPressEvent, UrlTile, MarkerDragStartEndEvent } from "react-native-maps";
// import { useRouter } from "expo-router";

// export default function SeleccionarDireccion() {
//   const router = useRouter();
//   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

//   // Región inicial → Guarenas
//   const defaultRegion = {
//     latitude: 10.476,
//     longitude: -66.599,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   // Cuando el usuario toca el mapa, colocamos el marcador
//   const handlePress = (event: MapPressEvent) => {
//     const coord = event.nativeEvent?.coordinate;
//     if (coord?.latitude && coord?.longitude) {
//       setLocation({ latitude: coord.latitude, longitude: coord.longitude });
//     }
//   };

//   // Cuando el usuario arrastra el marcador
//   const handleDragEnd = (event: MarkerDragStartEndEvent) => {
//   const coord = event.nativeEvent.coordinate;
//   setLocation({ latitude: coord.latitude, longitude: coord.longitude });
// };

//   const handleConfirm = () => {
//     if (location) {
//       router.push({
//         pathname: "/restaurantes/registrar-restaurantes",
//         params: { latitud: location.latitude, longitud: location.longitude },
//       });
//     } else {
//       alert("Por favor selecciona un punto en el mapa");
//     }
//   };

//   const handleCancel = () => {
//     router.push("/restaurantes/registrar-restaurantes");
//   };

//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         style={{ flex: 1 }}
//         initialRegion={defaultRegion}
//         onPress={handlePress}
//       >
//         {/* Tile de OpenStreetMap */}
//         <UrlTile
//           urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
//           maximumZ={19}
//         />

//         {location && (
//           <Marker
//             coordinate={location}
//             draggable // marcador arrastrable
//             onDragEnd={handleDragEnd} // actualizar coordenadas al moverlo
//           />
//         )}
//       </MapView>

//       <View style={{ position: "absolute", bottom: 10, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" }}>
//         <TouchableOpacity
//           style={{ backgroundColor: "#9CA3AF", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, flex: 1, marginRight: 8 }}
//           onPress={handleCancel}
//         >
//           <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Cancelar</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={{ backgroundColor: "#2563EB", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, flex: 1, marginLeft: 8 }}
//           onPress={handleConfirm}
//         >
//           <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Confirmar</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }


import { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as Location from "expo-location";

const MAPBOX_TOKEN = Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN;
MapboxGL.setAccessToken(MAPBOX_TOKEN);

export default function SeleccionarDireccion() {
  const router = useRouter();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [initialCoord, setInitialCoord] = useState<[number, number]>([-66.599, 10.476]); // Guarenas por defecto

  // 🔹 Obtener ubicación actual del usuario
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const userLoc = await Location.getCurrentPositionAsync({});
        setInitialCoord([userLoc.coords.longitude, userLoc.coords.latitude]);
      }
    })();
  }, []);

  // 🔹 Confirmar dirección
  const handleConfirm = () => {
    if (location) {
      router.push({
        pathname: "/restaurantes/registrar-restaurantes",
        params: {
          latitud: location[1],
          longitud: location[0],
        },
      });
    } else {
      Alert.alert("Selecciona una ubicación", "Toca el mapa para elegir una dirección.");
    }
  };

  // 🔹 Cancelar selección
  const handleCancel = () => {
    router.push("/restaurantes/registrar-restaurantes");
  };

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView
        onPress={(e) => {
          const coords = e.geometry as GeoJSON.Point; // forzar tipo
          setLocation(coords.coordinates as [number, number]);
        }}
      >

        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={location || initialCoord}
        />

        {location && (
          <MapboxGL.PointAnnotation id="marker" coordinate={location}>
            <View style={{ width: 24, height: 24, backgroundColor: 'red', borderRadius: 12 }} />
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* Botones */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={handleCancel}
          style={{
            backgroundColor: "#9CA3AF",
            borderRadius: 12,
            paddingVertical: 12,
            flex: 1,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
            Cancelar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 12,
            paddingVertical: 12,
            flex: 1,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
            Confirmar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
