import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f4",
          100: "#f9e3e8",
          200: "#f0c4cc",
          300: "#e49ba7",
          400: "#d46b7d",
          500: "#B8384F",
          600: "#9B1B3E",
          700: "#7B1D3D",
          800: "#5C1830",
          900: "#3D0F20",
          950: "#2A0A15",
        },
        gold: {
          50: "#fdf9ed",
          100: "#f9f0c8",
          200: "#f2dc8e",
          300: "#E8C55A",
          400: "#D4A843",
          500: "#B8912F",
          600: "#9A7A25",
          700: "#7D641D",
          800: "#5F4A15",
          900: "#42320E",
        },
        coral: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#E63946",
          600: "#D12D3A",
          700: "#B0202C",
          800: "#921A23",
          900: "#6B141B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(212, 168, 67, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
