import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/sections/**/*.{ts,tsx}",
  ],

  darkMode: "media", // ✅ 지금은 OS 기준으로 고정 (중요)

  theme: {
    extend: {},
  },

  plugins: [],
};

export default config;
