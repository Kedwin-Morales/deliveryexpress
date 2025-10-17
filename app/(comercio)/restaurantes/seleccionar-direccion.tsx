import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapaScreen() {
  const region = {
    latitude: -34.6037,
    longitude: -58.3816,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        <Marker
          coordinate={{ latitude: -34.6037, longitude: -58.3816 }}
          title="Tu ubicación"
          description="Ubicación de ejemplo"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
});
