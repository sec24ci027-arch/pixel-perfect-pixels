import { useSyncExternalStore } from "react";

export interface AuthUser {
  id?: string;
  email: string;
  name?: string;
}

const TOKEN_KEY = "raw.token";
const USER_KEY = "raw.user";

let token: string | null = null;
let user: AuthUser | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    user = raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    token = null;
    user = null;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export const authStore = {
  getToken() {
    ensureInit();
    return token;
  },
  getUser() {
    ensureInit();
    return user;
  },
  isAuthenticated() {
    ensureInit();
    return !!token;
  },
  setSession(nextToken: string, nextUser: AuthUser) {
    token = nextToken;
    user = nextUser;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
    emit();
  },
  clear() {
    token = null;
    user = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useAuth() {
  const snapshot = useSyncExternalStore(
    (cb) => authStore.subscribe(cb),
    () => authStore.getToken() ?? "",
    () => "",
  );
  return {
    token: snapshot || null,
    user: authStore.getUser(),
    isAuthenticated: !!snapshot,
    logout: () => authStore.clear(),
  };
}
