import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cloudviz_token");
    const storedUser = localStorage.getItem("cloudviz_user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data.data;
    localStorage.setItem("cloudviz_token", token);
    localStorage.setItem("cloudviz_user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  async function register(name, email, password) {
    const res = await api.post("/auth/register", { name, email, password });
    const { token, user } = res.data.data;
    localStorage.setItem("cloudviz_token", token);
    localStorage.setItem("cloudviz_user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem("cloudviz_token");
    localStorage.removeItem("cloudviz_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, authenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
