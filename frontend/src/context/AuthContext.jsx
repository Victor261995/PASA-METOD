import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pasa_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/api/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("pasa_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/api/login", { email, password });
    localStorage.setItem("pasa_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await api.post("/api/logout"); } catch {}
    localStorage.removeItem("pasa_token");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
