import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
   const isRoleSelected = useAuthStore((state) => state.selectedRole);
   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

   if (!isRoleSelected) return <Redirect href="/role-select" />;

   return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/sign-in"} />;
}
