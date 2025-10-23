import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
  const isHydrated = useAuthStore.persist.hasHydrated();
  const isRoleSelected = useAuthStore((state) => state.selectedRole);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isHydrated) return null; // Espera a que cargue el AsyncStorage

  if (!isRoleSelected) return <Redirect href="/role-select" />;

  // ✅ si ya está autenticado, redirige según el rol guardado
  if (isAuthenticated && user?.rol === 'comercio') return <Redirect href="/(comercio)" />;
  if (isAuthenticated && user?.rol === 'cliente') return <Redirect href="/(tabs)" />;
  if (isAuthenticated && user?.rol === 'conductor') return <Redirect href="/(delivery)" />;

  return <Redirect href="/(auth)/sign-in" />;
}
