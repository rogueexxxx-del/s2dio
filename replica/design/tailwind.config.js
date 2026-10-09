/** @type {import('tailwindcss').Config} */
// S2DIO Locked Design System Tailwind Theme Mapping
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      colors: {
        canvas: "var(--s2dio-bg, #07080a)",
        surface: {
          DEFAULT: "var(--s2dio-surface, #0d0d0d)",
          elevated: "var(--s2dio-surface-elevated, #121316)",
          card: "var(--s2dio-surface-card, #18191a)",
        },
        hairline: {
          DEFAULT: "var(--s2dio-border, #22242a)",
          strong: "var(--s2dio-border-strong, rgba(255, 255, 255, 0.16))",
          input: "var(--s2dio-border-input, #666870)",
        },
        primary: {
          DEFAULT: "var(--s2dio-primary, #ffffff)",
          pressed: "#e8e8e8",
          foreground: "var(--s2dio-on-primary, #000000)",
        },
        ink: "var(--s2dio-text, #f4f4f6)",
        body: "var(--s2dio-text-body, #cdcdcd)",
        mute: "var(--s2dio-text-muted, #9c9c9d)",
        ash: "var(--s2dio-text-ash, #6a6b6c)",
        accent: {
          green: "var(--s2dio-accent, #59d499)",
          "green-soft": "var(--s2dio-accent-soft, rgba(89, 212, 153, 0.15))",
          red: "var(--s2dio-danger, #ff6161)",
          "red-soft": "var(--s2dio-danger-soft, rgba(255, 97, 97, 0.15))",
          yellow: "var(--s2dio-warning, #ffd60a)",
          "yellow-soft": "var(--s2dio-warning-soft, rgba(255, 214, 10, 0.15))",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        lemon: ["var(--font-lemon)", "Lemon/Milk", "Lemon Milk", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04)",
        dock: "0 16px 40px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        modal: "0 24px 60px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        "glow-green": "0 0 16px rgba(89, 212, 153, 0.25)",
        "glow-red": "0 0 16px rgba(255, 97, 97, 0.25)",
      },
      transitionTimingFunction: {
        studio: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
