import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { PublicUser } from "@shared/schema";
import { queryClient } from "./queryClient";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

interface AuthState {
  token: string | null;
  user: PublicUser | null;
}

const TOKEN_KEY = "puwc_connect_token";

// The sign-in token is kept in this browser so a page refresh does not sign the
// attendee out. Storage can be unavailable (private mode), so every call is guarded.
function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function writeStoredToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

interface AuthContextValue extends AuthState {
  /** false while a saved sign-in is being checked on first load */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    accessCode: string;
    title?: string;
    company?: string;
    pastYears?: number[];
  }) => Promise<void>;
  logout: () => void;
  setUser: (user: PublicUser) => void;
  authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function throwIfNotOk(res: Response) {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [ready, setReady] = useState(false);

  // Restore a saved sign-in on first load.
  useEffect(() => {
    const saved = readStoredToken();
    if (!saved) {
      setReady(true);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setState({ token: saved, user: data.user });
        } else if (res.status === 401) {
          writeStoredToken(null);
        }
      })
      .catch(() => {
        // offline or server unreachable: stay signed out for now, keep the token
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const authedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> | undefined),
      };
      if (options.body) headers["Content-Type"] = "application/json";
      if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
      return fetch(`${API_BASE}${url}`, { ...options, headers });
    },
    [state.token]
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    await throwIfNotOk(res);
    const data = await res.json();
    queryClient.clear();
    writeStoredToken(data.token);
    setState({ token: data.token, user: data.user });
  }, []);

  const signup = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      accessCode: string;
      title?: string;
      company?: string;
      pastYears?: number[];
    }) => {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await throwIfNotOk(res);
      const json = await res.json();
      queryClient.clear();
      writeStoredToken(json.token);
      setState({ token: json.token, user: json.user });
    },
    []
  );

  const logout = useCallback(() => {
    const token = state.token;
    if (token) {
      // Tell the server to end the session; signing out locally does not wait for it.
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    writeStoredToken(null);
    setState({ token: null, user: null });
    queryClient.clear();
  }, [state.token]);

  const setUser = useCallback((user: PublicUser) => {
    setState((s) => ({ ...s, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, ready, login, signup, logout, setUser, authedFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
