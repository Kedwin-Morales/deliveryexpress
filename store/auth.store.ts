// stores/auth.store.ts
import { User } from '@/type';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  selectedRole: string | null;
  verificado: {
    email: boolean;
    telefono: boolean;
    cedula: boolean;
  } | null;

  // --- Acciones ---
  login: (user: User) => void;
  logout: () => void;
  setRole: (role: string) => void;
  setVerificado: (v: { email: boolean; telefono: boolean; cedula: boolean }) => void;
  setUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      selectedRole: null,
      verificado: null,

      login: (user) =>
        set({
          isAuthenticated: true,
          user,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          verificado: null,
          selectedRole: null,
        }),

      setRole: (role) => set({ selectedRole: role }),
      setVerificado: (v) => set({ verificado: v }),

      setUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : state.user,
        })),
    }),
    {
      name: 'auth-storage', // nombre del almacenamiento
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper para acceder más fácil a partes del store
export const useAuth = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    verificado: state.verificado,
    selectedRole: state.selectedRole,
  }));
