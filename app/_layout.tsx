import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import "./global.css";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "QuickSand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
    "QuickSand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "QuickSand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "QuickSand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
  });

  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [hydrated, setHydrated] = useState(false);

  // Esperar a que el store termine de hidratarse
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // También en caso de que ya esté listo
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error, hydrated]);

  // 🔹 Redirecciones automáticas
  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup =
      segments[0] === "(auth)" || segments[0] === "role-select";

    if (isAuthenticated && inAuthGroup) {
      if (user?.rol === "cliente") router.replace("/(tabs)");
      if (user?.rol === "comercio") router.replace("/(comercio)");
      if (user?.rol === "conductor") router.replace("/(delivery)");
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, hydrated, isAuthenticated]);

  if (!fontsLoaded || !hydrated) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
