/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          input: "var(--color-border-input)",
        },
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-on-accent)",
        },
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        rack: "var(--shadow-rack)",
        panel: "var(--shadow-panel)",
        "glow-signal": "var(--shadow-glow-signal)",
        "glow-peak": "var(--shadow-glow-peak)",
      },
      transitionDuration: {
        instant: "var(--motion-instant)",
        meter: "var(--motion-meter)",
        fast: "var(--motion-fast)",
        base: "var(--motion-base)",
      },
    },
  },
  plugins: [],
};
