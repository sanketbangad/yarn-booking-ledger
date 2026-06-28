import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ledger palette — neutrals + a deep trade-green accent.
        bg: "#F6F7F8",
        surface: "#FFFFFF",
        border: "#E7E9EC",
        "border-strong": "#D6D9DD",
        ink: "#181B1F",
        muted: "#6B7280",
        faint: "#9CA3AF",
        primary: {
          DEFAULT: "#0E7C5A",
          hover: "#0B6549",
          soft: "#E7F4EF",
          ring: "#0E7C5A33",
        },
        danger: {
          DEFAULT: "#C0392B",
          hover: "#A93226",
          soft: "#FBEAE8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        pop: "0 10px 30px rgba(16,24,40,0.12), 0 2px 8px rgba(16,24,40,0.08)",
      },
      borderRadius: {
        xl: "0.85rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "row-flash": {
          "0%": { backgroundColor: "#E7F4EF" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "scale-in": "scale-in 0.16s ease-out",
        "row-flash": "row-flash 1.6s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
