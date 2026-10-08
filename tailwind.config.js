/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#07080a",
        surface: {
          DEFAULT: "#0d0d0d",
          elevated: "#101111",
          card: "#121212",
        },
        button: {
          fg: "#18191a",
        },
        hairline: {
          DEFAULT: "#242728",
          soft: "rgba(255, 255, 255, 0.08)",
          strong: "rgba(255, 255, 255, 0.16)",
        },
        primary: {
          DEFAULT: "#ffffff",
          pressed: "#e8e8e8",
          foreground: "#000000",
        },
        ink: "#f4f4f6",
        body: "#cdcdcd",
        charcoal: "#d3d3d4",
        mute: "#9c9c9d",
        ash: "#6a6b6c",
        stone: "#434345",
        accent: {
          red: "#ff6161",
          "red-soft": "rgba(255, 97, 97, 0.15)",
          green: "#59d499",
          "green-soft": "rgba(89, 212, 153, 0.15)",
          blue: "#57c1ff",
          "blue-soft": "rgba(87, 193, 255, 0.15)",
          yellow: "#ffc533",
          "yellow-soft": "rgba(255, 197, 51, 0.15)",
        },
        hero: {
          "stripe-start": "#ff5757",
          "stripe-end": "#a1131a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "16px",
        full: "9999px",
      },
      spacing: {
        section: "96px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "100% 0" },
          "100%": { backgroundPosition: "-100% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 5s linear infinite",
      },
    },
  },
  plugins: [],
};
