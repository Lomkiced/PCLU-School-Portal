import { create } from "zustand";

interface User {
    id: string;
    email: string;
    role: string;
    profilePicture?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    setAuth: (user, token) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", token);
            localStorage.setItem("user", JSON.stringify(user));
        }
        set({ user, accessToken: token, isAuthenticated: true });
    },

    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
    },

    hydrate: () => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            const userStr = localStorage.getItem("user");
            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    set({ user, accessToken: token, isAuthenticated: true });
                } catch {
                    set({ user: null, accessToken: null, isAuthenticated: false });
                }
            }
        }
    },
}));
