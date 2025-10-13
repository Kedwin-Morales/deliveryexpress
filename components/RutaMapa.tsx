import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import axios from "axios";

interface Coord {
  latitude: number;
  longitude: number;
}

interface RutaMapaProps {
  origen: Coord;   // 🚴 Ubicación del delivery
  destino: Coord;  // 📍 Ubicación del pedido (cliente)
}

const RutaMapa = ({ origen, destino }: RutaMapaProps) => {
  const [coords, setCoords] = useState<Coord[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const fetchRuta = async () => {
      try {
        const url = `http://161.97.137.192:5000/route/v1/driving/${origen.longitude},${origen.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`;

        const res = await axios.get(url);

        // GeoJSON: [lng, lat]
        const routeCoords: Coord[] = res.data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => ({
            latitude: c[1],
            longitude: c[0],
          })
        );

        setCoords(routeCoords);

        // Ajustar cámara al trazar la ruta
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(routeCoords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } catch (err) {
        console.log("Error obteniendo la ruta:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuta();
  }, [origen, destino]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <View style={{ height: 300, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        initialRegion={{
          latitude: origen.latitude,
          longitude: origen.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Polyline coordinates={coords} strokeColor="#007bff" strokeWidth={4} />
        <Marker coordinate={origen} title="🚴 Delivery" />
        <Marker coordinate={destino} title="📍 Pedido" />
      </MapView>
    </View>
  );
};

export default RutaMapa;
