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
  idToken: string | null;
  hasHydrated: boolean;
  authReady: boolean;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
  setUser: (user: AuthUser) => void;
  setIdToken: (token: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
  setAuthReady: (ready: boolean) => void;
  logout: () => void;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const state = useAuthStore.getState();
  return state.firebaseUser ? state.firebaseUser.uid : null;
}

export function getFirebaseIdToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  if (state.firebaseUser) return state.firebaseUser.getIdToken().catch(() => null);
  if (state.idToken) return Promise.resolve(state.idToken);
  return Promise.resolve(null);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      firebaseUser: null,
      user: null,
      isAuthenticated: false,
      idToken: null,
      hasHydrated: false,
      authReady: false,
      setFirebaseUser: (firebaseUser: FirebaseUser | null): void => {
        set({ firebaseUser });
      },
      setUser: (user: AuthUser): void => {
        set({ user });
      },
      setIdToken: (token: string | null): void => {
        set({ idToken: token, isAuthenticated: token !== null });
      },
      setHasHydrated: (hydrated: boolean): void => {
        set({ hasHydrated: hydrated });
      },
      setAuthReady: (ready: boolean): void => {
        set({ authReady: ready });
      },
      logout: (): void => {
        set({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
          idToken: null,
        });
      },
    }),
    {
      name: "el-bannawy-auth",
      partialize: (state) => ({
        user: state.user,
        idToken: state.idToken,
      }),
      onRehydrateStorage: () => (): void => {
        useAuthStore.getState().setHasHydrated(true);
      },
    },
  ),
);
