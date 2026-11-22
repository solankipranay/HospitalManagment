import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  role: string | null;
  userId: string | null;
  name: string | null;
  isLoading: boolean;
  setAuth: (
    token: string,
    role: string,
    userId: string,
    name: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  userId: null,
  name: null,
  isLoading: true,

  setAuth: async (token, role, userId, name) => {
    await AsyncStorage.multiSet([
      ["auth_token", token],
      ["user_role", role],
      ["user_id", userId],
      ["user_name", name],
    ]);
    set({ token, role, userId, name });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      "auth_token",
      "user_role",
      "user_id",
      "user_name",
    ]);
    set({ token: null, role: null, userId: null, name: null });
  },

  loadAuth: async () => {
    const [[, token], [, role], [, userId], [, name]] =
      await AsyncStorage.multiGet([
        "auth_token",
        "user_role",
        "user_id",
        "user_name",
      ]);
    set({ token, role, userId, name, isLoading: false });
  },
}));
