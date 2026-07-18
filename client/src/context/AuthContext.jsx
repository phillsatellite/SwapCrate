import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

// Holds the current user and auth actions. The session lives in an httpOnly
// cookie, so on load we ask the server (/me) whether we're logged in.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const { user: u } = await api.login(credentials);
    setUser(u);
    return u;
  }

  async function register(payload) {
    const { user: u } = await api.register(payload);
    setUser(u);
    return u;
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // even if the request fails, drop the local session
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
