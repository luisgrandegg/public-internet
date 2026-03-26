import type { Config } from "tailwindcss";

const preset: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
      },
    },
  },
};

export default preset;
