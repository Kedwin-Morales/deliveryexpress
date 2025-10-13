// stores/authStore.ts
import { create } from 'zustand';
import { User } from '@/type';

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

  // 👇 Nueva acción para actualizar parcialmente el usuario
  setUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
    }),

  setRole: (role) => set({ selectedRole: role }),
  setVerificado: (v) => set({ verificado: v }),

  // 👇 Nueva acción
  setUser: (updatedUser) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : state.user,
    })),
}));

// 3️⃣  (opcional) Exporta helpers para seleccionar campos sin re-renderizar todo
export const useAuth = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    verificado: state.verificado, // 👈 puedes usarlo también aquí
  }));
