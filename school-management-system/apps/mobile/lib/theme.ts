export const theme = {
    colors: {
        primary: "#3b49df",
        primaryLight: "#5a66e8",
        secondary: "#14b8a6",
        background: "#f5f6fa",
        card: "#ffffff",
        text: "#1a1f3a",
        textSecondary: "#6b7280",
        border: "#e5e7eb",
        success: "#16a34a",
        warning: "#f59e0b",
        destructive: "#ef4444",
        info: "#0ea5e9",
        white: "#ffffff",
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
    font: {
        regular: "System",
        medium: "System",
        bold: "System",
    },
};

export type Theme = typeof theme;
