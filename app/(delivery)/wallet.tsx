import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Feather } from "@expo/vector-icons";

const transactions = [
  {
    id: "TX-001",
    tipo: "Ingreso",
    monto: 120.5,
    fecha: "15 Sep, 2025",
    estado: "Completado",
  },
  {
    id: "TX-002",
    tipo: "Retiro",
    monto: -50.0,
    fecha: "14 Sep, 2025",
    estado: "Pendiente",
  },
  {
    id: "TX-003",
    tipo: "Ingreso",
    monto: 80.0,
    fecha: "12 Sep, 2025",
    estado: "Completado",
  },
];

export default function Wallet() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="py-6 bg-blue-700">
        <Text className="text-xl font-bold text-white text-center">Wallet</Text>
      </View>

      <View className="flex-row justify-between items-center px-4 py-2 mt-2">
        {/* Saldo disponible */}
        <View className="px-4 py-4 items-center bg-white rounded-2xl elevation-md flex-row justify-around gap-2 w-44">
          <View>
            <Text className="text-gray-500 mt-2">Saldo disponible</Text>
            <Text className="text-xl font-bold text-green-600 mt-1">$250.50</Text>
          </View>
          <FontAwesome5 name="dollar-sign" size={20} color="#16a34a" />
        </View>

        {/* Envíos */}
        <View className="px-4 py-4 items-center bg-white rounded-2xl elevation-md justify-around flex-row gap-2 w-44">
          <View>
            <Text className="text-gray-500 mt-2">Envíos</Text>
            <Text className="text-xl font-bold text-primary mt-1">8</Text>
          </View>
          <Feather name="trending-up" size={20} color="#0033A0" />

        </View>
      </View>


      {/* Historial de Transacciones */}
      <View className="px-6 mt-4">
        <Text className="font-bold text-lg text-gray-800 mb-2">
          Historial de Transacciones
        </Text>
      </View>

      <ScrollView className="px-6 ">
        {transactions.map((tx) => (
          <View
            key={tx.id}
            className="bg-white rounded-2xl mt-4 elevation-md p-4 flex-row justify-between items-center"
          >
            {/* Info */}
            <View>
              <Text className="font-semibold text-gray-800">{tx.tipo}</Text>
              <Text className="text-sm text-gray-500">{tx.fecha}</Text>
            </View>

            {/* Monto */}
            <View className="items-end">
              <Text
                className={`font-bold text-lg ${tx.monto > 0 ? "text-green-600" : "text-red-600"
                  }`}
              >
                {tx.monto > 0 ? `+ $${tx.monto}` : `- $${Math.abs(tx.monto)}`}
              </Text>
              <Text
                className={`text-xs font-semibold ${tx.estado === "Completado"
                  ? "text-green-500"
                  : "text-yellow-500"
                  }`}
              >
                {tx.estado}
              </Text>
            </View>
          </View>
        ))}

        <View className="mt-6">
        <TouchableOpacity className="bg-secondary py-4 rounded-xl w-3/4 self-center">
          <Text className="text-center text-white font-bold text-lg">Retirar</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      

    </SafeAreaView>
  );
}
