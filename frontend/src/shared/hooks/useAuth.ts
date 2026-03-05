import { create } from "zustand";
import type { User } from "../api/auth";
import * as authApi from "../api/auth";
import { setToken, clearToken, getToken } from "../api/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password });
    setToken(tokens.access_token, tokens.refresh_token);
    const user = await authApi.getMe();
    set({ user, isAuthenticated: true });
  },

  register: async (email: string, password: string, name: string) => {
    const tokens = await authApi.register({ email, password, name });
    setToken(tokens.access_token, tokens.refresh_token);
    const user = await authApi.getMe();
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    clearToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
