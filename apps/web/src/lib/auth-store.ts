import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User as FirebaseUser } from "firebase/auth";
import type { Permission } from "@el-bannawy/shared";

export interface AuthUser {
  id: string;
  fullName: string;
  mobileNumber: string | null;
  role: string;
  status: string;
  effectivePermissions?: Permission[];
}

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const state = useAuthStore.getState();
  return state.firebaseUser ? state.firebaseUser.uid : null;
}

export function getFirebaseIdToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  if (!state.firebaseUser) return Promise.resolve(null);
  return state.firebaseUser.getIdToken().catch(() => null);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      firebaseUser: null,
      user: null,
      isAuthenticated: false,
      setFirebaseUser: (firebaseUser: FirebaseUser | null): void => {
        set({ firebaseUser, isAuthenticated: firebaseUser !== null });
      },
      setUser: (user: AuthUser): void => {
        set({ user });
      },
      logout: (): void => {
        set({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "el-bannawy-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
