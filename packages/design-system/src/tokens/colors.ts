export const colors = {
  brand: {
    50: "#f0f4ff",
    100: "#dde6ff",
    200: "#c2d2ff",
    300: "#9db4ff",
    400: "#718aff",
    500: "#4361ee",
    600: "#3045d4",
    700: "#2535ac",
    800: "#23308b",
    900: "#222e6e",
    950: "#151c44",
  },
  neutral: {
    0: "#ffffff",
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
  feedback: {
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626",
    info: "#2563eb",
  },
} as const;

export type Colors = typeof colors;
