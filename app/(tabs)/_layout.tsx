// app/_layout.tsx o app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import { Image, Text, View} from "react-native";
import { useAuthStore } from "@/store/auth.store";
import { images } from "@/constants";
import cn from "clsx";

const TabBarIcon = ({ focused, icon, title }: { focused: boolean; icon: any; title: string }) => (
  <View className="tab-icon flex justify-center items-center w-4">
    <Image
      source={icon}
      className="size-7"
      resizeMode="cover"
      tintColor={focused ? "#FE8C00" : "#5D5F6D"}
    />
    <Text className={cn("text-sm font-bold", "text-gray-600")}>{title}</Text>
  </View>
);

export default function TabsLayout() {
  const { isAuthenticated} = useAuthStore();
  if (!isAuthenticated) return <Redirect href="/sign-in" />;

  // ✅ Tabs principales
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          borderBottomLeftRadius: 50,
          borderBottomRightRadius: 50,
          marginHorizontal: 20,
          height: 80,
          position: "absolute",
          bottom: 20,
          backgroundColor: "white",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Inicio" icon={images.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Buscar",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Buscar" icon={images.search} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrito",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Carrito" icon={images.bag} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Perfil" icon={images.person} focused={focused} />,
        }}
      />

      {/* 🚫 Rutas ocultas */}
      <Tabs.Screen name="perfil/historial" options={{ href: null }} />
      <Tabs.Screen name="perfil/direccion" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/formulario-direccion" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/formulario-perfil" options={{ href: null }} />
      <Tabs.Screen name="restaurante/restaurante" options={{ href: null }} />
      <Tabs.Screen name="restaurante/plato-detalle" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/orden-detalle" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="orden/pago-movil" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/seleccionar-direccion" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-registro" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-cedula" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-telefono" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-email" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/foto-perfil" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}
