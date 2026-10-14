import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";

/**
 * Auth against the C# backend.
 *
 * Expected backend contract (the API must add POST /api/Auth/login):
 *   POST /api/Auth/login   { email, password }        -> { accessToken | token, user? }
 *   POST /api/Auth/register { fullName,email,phone,password,channel } -> { userId }
 *   POST /api/Auth/otp/verify { userId | email, code } -> { accessToken | token }?
 *   POST /api/Auth/otp/resend { userId | email, channel }
 *   GET  /api/me  -> current profile (used to hydrate the user)
 */

export type Role = "student" | "counsellor" | "parent" | "university_admin" | "super_admin" | "employer";

export type AuthUser = {
  id?: string;
  email?: string;
  fullName?: string;
  role?: Role;
};

type LoginResponse = {
  access_token?: string; // backend LoginResponse (snake_case)
  accessToken?: string;
  token?: string;
  user?: AuthUser;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export const HOME_BY_ROLE: Record<Role, string> = {
  student: "/dashboard",
  parent: "/parent-dashboard",
  counsellor: "/counsellor-dashboard",
  university_admin: "/uni-admin-dashboard",
  super_admin: "/admin-dashboard",
  employer: "/employer-dashboard",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTok] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on the client
  useEffect(() => {
    const t = getToken();
    setTok(t);
    if (t) {
      refreshMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshMe() {
    try {
      const me = await api.get<AuthUser>("/api/me");
      setUser(me);
    } catch {
      // token invalid/expired — clear it
      setToken(null);
      setTok(null);
      setUser(null);
    }
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    const res = await api.post<LoginResponse>("/api/Auth/login", { email, password }, { auth: false });
    const jwt = res.access_token ?? res.accessToken ?? res.token ?? null;
    setToken(jwt);
    setTok(jwt);
    let u = res.user ?? null;
    if (!u && jwt) {
      u = await api.get<AuthUser>("/api/me");
    }
    setUser(u);
    return u ?? {};
  }

  function logout() {
    setToken(null);
    setTok(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
