// AltoLumo Brand Book v8: real palette + Inter-only typography (see
// docs/mockup/atrium-v8-model.html, the verified source of these tokens --
// never invent new colors here without updating that reference).
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./data/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F1",
        ink: "#1D2536",
        steel: "#4682B4",
        "deep-steel": "#1F4E79",
        "light-steel": "#9DC3E6",
        "warm-tint": "#F2EDE3",
        hairline: "#E2DCCE",
      },
      fontFamily: {
        // Brand Book v8: "no serif display faces ... anywhere" -- Inter only.
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
