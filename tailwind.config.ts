import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dairy: {
          cream: "#FAF6EE",
          "cream-light": "#FDFBF7",
          "cream-dark": "#F0E7D5",
          green: "#184E2E",
          "green-light": "#236D42",
          "green-dark": "#0E341E",
          maroon: "#6B1D27",
          "maroon-light": "#892736",
          gold: "#D99B26",
          "gold-light": "#F4BD4A",
          "gold-dark": "#B87F17",
          text: "#1E2420",
          muted: "#6B726C",
          border: "#E7DEC9",
          card: "#FFFFFF",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        dairy: "0 4px 20px -2px rgba(24, 78, 46, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "dairy-hover": "0 12px 30px -4px rgba(24, 78, 46, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
