import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1020",
        saffron: "#ffb02e",
        jade: "#18c987",
        electric: "#4f8cff",
        rose: "#ff577f"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(79,140,255,0.25)"
      }
    }
  },
  plugins: []
};

export default config;
