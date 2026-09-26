import { createContext, useContext, useMemo, useState } from "react";
import { loginUser, registerUser } from "../api/auth";
import { extractErrorMessage } from "../api/client";

const AuthContext = createContext(null);

// Digs a role/name out of whatever shape the login response has —
// { role }, { user: { role } }, or a JWT "role" claim. Falls back to
// a role picked manually on the login screen if none of these exist.
function decodeJwtRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { role: payload.role || payload.user_role || null, name: payload.name || payload.sub || null };
  } catch {
    return { role: null, name: null };
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("ser_token"));
  const [role, setRole] = useState(() => localStorage.getItem("ser_role"));
  const [name, setName] = useState(() => localStorage.getItem("ser_name"));

  function persistSession({ accessToken, role: r, name: n }) {
    localStorage.setItem("ser_token", accessToken);
    if (r) localStorage.setItem("ser_role", r);
    if (n) localStorage.setItem("ser_name", n);
    setToken(accessToken);
    setRole(r || null);
    setName(n || null);
  }

  async function login({ email, password, fallbackRole }) {
    const res = await loginUser({ email, password });
    const data = res.data || {};
    const accessToken = data.access_token || data.token;
    if (!accessToken) throw new Error("Login response had no access token.");
    const fromJwt = decodeJwtRole(accessToken);
    const resolvedRole = data.role || data.user?.role || fromJwt.role || fallbackRole;
    const resolvedName = data.name || data.user?.name || fromJwt.name || email;
    persistSession({ accessToken, role: resolvedRole, name: resolvedName });
    return resolvedRole;
  }

  async function register({ name: n, email, password, role: r }) {
    await registerUser({ name: n, email, password, role: r });
  }

  function logout() {
    localStorage.removeItem("ser_token");
    localStorage.removeItem("ser_role");
    localStorage.removeItem("ser_name");
    setToken(null);
    setRole(null);
    setName(null);
  }

  const value = useMemo(
    () => ({ token, role, name, login, register, logout, isAuthed: Boolean(token) }),
    [token, role, name]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { extractErrorMessage };
