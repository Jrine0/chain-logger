import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf6",
          100: "#dcfce9",
          200: "#bbf7d1",
          300: "#86efad",
          400: "#4ade7f",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803b",
          800: "#166533",
          900: "#14532a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
