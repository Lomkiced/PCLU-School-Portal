import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
    id: string;
    email: string;
    role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
    profilePicture?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: async (user, token) => {
        await SecureStore.setItemAsync("accessToken", token);
        await SecureStore.setItemAsync("user", JSON.stringify(user));
        set({ user, accessToken: token, isAuthenticated: true });
    },

    logout: async () => {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("user");
        set({ user: null, accessToken: null, isAuthenticated: false });
    },

    hydrate: async () => {
        try {
            const token = await SecureStore.getItemAsync("accessToken");
            const userStr = await SecureStore.getItemAsync("user");
            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch {
            set({ isLoading: false });
        }
    },
}));
