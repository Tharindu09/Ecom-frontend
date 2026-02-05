import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, register as registerRequest } from "../api/authService.js";
import { getMe } from "../api/userService.js";
import { STORAGE_KEYS } from "../api/endpoints.js";

const AuthContext = createContext(null);

const loadStoredUser = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.token));
  const [user, setUser] = useState(loadStoredUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      getMe()
        .then((data) => {
          if (data) {
            setUser(data);
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
          }
        })
        .catch((error) => {
          console.error("Failed to fetch current user", error);
        });
    }
  }, [token, user]);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await loginRequest({ email, password });
      const receivedToken = data?.token || data?.accessToken || data?.jwt;
      if (receivedToken) {
        localStorage.setItem(STORAGE_KEYS.token, receivedToken);
        setToken(receivedToken);
      }
      if (data?.user) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        setUser(data.user);
      }
      return { ok: true, data };
    } catch (error) {
      console.error("Login failed", error);
      return { ok: false, error };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const data = await registerRequest({ name, email, password });
      const receivedToken = data?.token || data?.accessToken || data?.jwt;
      if (receivedToken) {
        localStorage.setItem(STORAGE_KEYS.token, receivedToken);
        setToken(receivedToken);
      }
      if (data?.user) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
        setUser(data.user);
      }
      return { ok: true, data };
    } catch (error) {
      console.error("Registration failed", error);
      return { ok: false, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.cartId);
    localStorage.removeItem(STORAGE_KEYS.cartItems);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      login,
      register,
      logout,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
