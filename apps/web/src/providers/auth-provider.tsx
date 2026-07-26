"use client";

import { createContext, useContext, useEffect, useRef, useMemo, type ReactNode, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client-auth";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { normalizeEgyptMobile } from "@/lib/phone";
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
  email?: string;
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
  const normalized = normalizeEgyptMobile(identity);
  if (normalized) identity = normalized;
  return `${identity.replace(/[+\s]/g, '')}@el-bannawy.app`;
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const {
    user,
    isAuthenticated,
    setFirebaseUser,
    setUser,
    setIdToken,
    setAuthReady,
    logout: clearStore,
  } = useAuthStore();

  const queryClient = useQueryClient();
  const initRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  const setAuthCookie = useCallback((token: string, maxAge = 60 * 60 * 24 * 14): void => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = 'auth_token=' + token + '; path=/; max-age=' + String(maxAge) + '; SameSite=Lax' + secure;
  }, []);

  const clearAuthCookie = useCallback((): void => {
    document.cookie = "auth_token=; path=/; max-age=0";
  }, []);

  const fetchUser = useCallback(async (fbUser: FirebaseUser): Promise<void> => {
    try {
      const token = await fbUser.getIdToken(true);
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
          role: (response.data.role ?? "").toUpperCase(),
          effectivePermissions: response.data.effectivePermissions as Permission[],
        });
      }
    } catch {
      const email = fbUser.email ?? '';
      setUser({
        id: fbUser.uid,
        fullName: fbUser.displayName ?? "User",
        mobileNumber: email.includes('@el-bannawy.app') ? email.replace('@el-bannawy.app', '') : email || null,
        role: "STUDENT",
        status: "active",
      });
    }
  }, [setUser]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const unsubscribe = onAuthStateChanged(getClientAuth(), (fbUser: FirebaseUser | null) => {
      setAuthReady(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        void fbUser.getIdToken(true).then((token: string) => {
          setAuthCookie(token);
          setIdToken(token);
        });
        if (!userRef.current) {
          void fetchUser(fbUser);
        }
      } else if (!userRef.current) {
        setFirebaseUser(null);
        setIdToken(null);
        clearAuthCookie();
        fetch('/api/v1/auth/sign-out', { method: 'POST' }).catch(() => {});
      }
    });

    return (): void => { unsubscribe(); };
  }, [setFirebaseUser, setIdToken, setAuthReady, fetchUser, setAuthCookie, clearAuthCookie]);

  const login = useCallback(
    async (emailOrMobile: string, password: string, _rememberMe = false): Promise<void> => {
      const email = toEmail(emailOrMobile);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch('/api/v1/auth/sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data.token) throw new Error(data.error?.message || 'Login failed');
        setAuthCookie(data.token);
        setIdToken(data.token);
        setUser({
          id: data.user.id,
          fullName: data.user.fullName,
          mobileNumber: data.user.email?.includes('@el-bannawy.app') ? data.user.email.replace('@el-bannawy.app', '') : data.user.email ?? null,
          role: (data.user.role ?? "").toUpperCase(),
          status: 'active',
        });
        queryClient.removeQueries({ queryKey: ["profile"] });
        queryClient.removeQueries({ queryKey: ["sidebar-profile"] });

        const meRes = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${data.token}` },
          signal: controller.signal,
        });
        const meData = await meRes.json();
        if (meData.success && meData.data) {
          setUser({
            ...meData.data,
            role: (meData.data.role ?? "").toUpperCase(),
            effectivePermissions: meData.data.effectivePermissions as Permission[],
          });
        }
      } finally {
        clearTimeout(timeout);
      }
    },
    [setUser, queryClient],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<void> => {
      const response = await api.post<{ uid: string }>("/auth/register", payload);
      if (!response.data?.uid) {
        throw new Error("Registration failed");
      }
      const signInEmail = payload.email ?? toEmail(payload.mobile.replace(/[+\s]/g, ''));
      const signInRes = await fetch('/api/v1/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: payload.password }),
      });
      const signInData = await signInRes.json();
      if (!signInRes.ok || !signInData.token) {
        throw new Error(signInData.error?.message ?? "فشل تسجيل الدخول بعد إنشاء الحساب");
      }
      setIdToken(signInData.token);
      setAuthCookie(signInData.token);
      if (signInData.user) setUser({ ...signInData.user, role: (signInData.user.role ?? "").toUpperCase() });
      queryClient.removeQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["sidebar-profile"] });

      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${signInData.token}` },
      });
      const meData = await meRes.json();
      if (meData.success && meData.data) {
        setUser({
          ...meData.data,
          role: (meData.data.role ?? "").toUpperCase(),
          effectivePermissions: meData.data.effectivePermissions as Permission[],
        });
      }
    },
    [setIdToken, setUser, queryClient],
  );

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(getClientAuth(), provider);
    const token = await result.user.getIdToken(true);
    setAuthCookie(token);
    setIdToken(token);
    await fetchUser(result.user);
  }, [fetchUser, setAuthCookie, setIdToken]);

  const signInWithApple = useCallback(async (): Promise<void> => {
    const provider = new OAuthProvider('apple.com');
    const result = await signInWithPopup(getClientAuth(), provider);
    const token = await result.user.getIdToken(true);
    setAuthCookie(token);
    setIdToken(token);
    await fetchUser(result.user);
  }, [fetchUser, setAuthCookie, setIdToken]);

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
      try {
        await fetch('/api/v1/auth/sign-out', { method: 'POST' });
      } catch {
        // ignore network errors on logout
      }
      clearStore();
      clearAuthCookie();
      queryClient.clear();
      window.location.href = "/login";
    }
  }, [clearStore, queryClient]);

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    register,
    signInWithGoogle,
    signInWithApple,
    oauthRegister,
    logout,
  }), [isAuthenticated, user, login, register, signInWithGoogle, signInWithApple, oauthRegister, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
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
