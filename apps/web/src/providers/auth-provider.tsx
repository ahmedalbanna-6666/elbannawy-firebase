"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import type { Permission } from "@el-bannawy/shared";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: {
    id: string;
    fullName: string;
    mobileNumber: string | null;
    role: string;
    status: string;
    effectivePermissions?: Permission[];
  } | null;
  login: (emailOrMobile: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  oauthRegister: (payload: OAuthRegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterPayload {
  fullName: string;
  englishName?: string;
  mobile: string;
  parentMobile?: string;
  password: string;
  confirmPassword: string;
  governorate?: string;
  school?: string;
  educationalSystem?: string;
  educationalStage?: string;
  grade?: string;
}

interface OAuthRegisterPayload {
  email: string;
  fullName: string;
  englishName?: string;
  mobile: string;
  parentMobile?: string;
  password?: string;
  governorate?: string;
  school?: string;
  educationalSystem?: string;
  educationalStage?: string;
  grade?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toEmail(identity: string): string {
  if (identity.includes("@")) return identity;
  return `${identity}@el-bannawy.app`;
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    setFirebaseUser,
    setUser,
    logout: clearStore,
  } = useAuthStore();

  const queryClient = useQueryClient();
  const initRef = useRef(false);

  const fetchUser = useCallback(async (fbUser: FirebaseUser): Promise<void> => {
    try {
      const token = await fbUser.getIdToken();
      const response = await api.get<{
        id: string;
        fullName: string;
        mobileNumber: string | null;
        role: string;
        status: string;
        effectivePermissions: string[];
      }>("/auth/me", { Authorization: `Bearer ${token}` });
      if (response.data) {
        setUser({
          ...response.data,
          effectivePermissions: response.data.effectivePermissions as Permission[],
        });
      }
    } catch {
      setUser({
        id: fbUser.uid,
        fullName: fbUser.displayName ?? "User",
        mobileNumber: fbUser.email?.replace("@el-bannawy.app", "") ?? null,
        role: "student",
        status: "active",
      });
    }
  }, [setUser]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const unsubscribe = onAuthStateChanged(getClientAuth(), (fbUser: FirebaseUser | null) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        void fbUser.getIdToken().then((token: string) => {
          const maxAge = 60 * 60 * 24 * 14;
          document.cookie = 'auth_token=' + token + '; path=/; max-age=' + String(maxAge) + '; SameSite=Lax';
        });
        if (!user) {
          void fetchUser(fbUser);
        }
      } else {
        document.cookie = "auth_token=; path=/; max-age=0";
      }
    });

    return (): void => { unsubscribe(); };
  }, [setFirebaseUser, fetchUser, user]);

  const login = useCallback(
    async (emailOrMobile: string, password: string, _rememberMe = false): Promise<void> => {
      const email = toEmail(emailOrMobile);
      const result = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const token = await result.user.getIdToken();
      const maxAge = 60 * 60 * 24 * 14;
      document.cookie = 'auth_token=' + token + '; path=/; max-age=' + String(maxAge) + '; SameSite=Lax';
      await fetchUser(result.user);
      queryClient.removeQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["sidebar-profile"] });
    },
    [fetchUser, queryClient],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<void> => {
      const response = await api.post<{ uid: string }>("/auth/register", payload);
      if (!response.data?.uid) {
        throw new Error("Registration failed");
      }
      const email = toEmail(payload.mobile);
      const result = await signInWithEmailAndPassword(getClientAuth(), email, payload.password);
      await fetchUser(result.user);
      queryClient.removeQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["sidebar-profile"] });
    },
    [fetchUser, queryClient],
  );

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getClientAuth(), provider);
    const token = await result.user.getIdToken();
    document.cookie = 'auth_token=' + token + '; path=/; max-age=' + String(60 * 60 * 24 * 14) + '; SameSite=Lax';
    await fetchUser(result.user);
  }, [fetchUser]);

  const signInWithApple = useCallback(async (): Promise<void> => {
    const provider = new OAuthProvider('apple.com');
    const result = await signInWithPopup(getClientAuth(), provider);
    const token = await result.user.getIdToken();
    document.cookie = 'auth_token=' + token + '; path=/; max-age=' + String(60 * 60 * 24 * 14) + '; SameSite=Lax';
    await fetchUser(result.user);
  }, [fetchUser]);

  const oauthRegister = useCallback(
    async (payload: OAuthRegisterPayload): Promise<void> => {
      const token = await getClientAuth().currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await api.post<{ uid: string }>("/auth/complete-oauth-registration", payload, headers);
      if (!response.data?.uid) {
        throw new Error("OAuth registration failed");
      }
      queryClient.removeQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["sidebar-profile"] });
    },
    [queryClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(getClientAuth());
    } catch {
      // ignore errors on logout
    } finally {
      clearStore();
      document.cookie = "auth_token=; path=/; max-age=0";
      queryClient.clear();
      router.push("/login");
    }
  }, [clearStore, queryClient, router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        signInWithGoogle,
        signInWithApple,
        oauthRegister,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
