import type { Config } from "tailwindcss";

/**
 * Palette and type ramp ported 1:1 from the Relay design prototype
 * so component classes can stay readable while remaining pixel-faithful.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F7F8",
        line: "#E3E7EA",
        "line-soft": "#EFF1F2",
        "line-faint": "#F1F3F4",
        primary: "#0E3A4F",
        ink: "#16242B",
        "ink-2": "#1B2A31",
        slate: {
          700: "#2A3940",
          600: "#3A4A52",
          500: "#41525A",
          450: "#46555C",
          400: "#5C6B73",
        },
        muted: "#8A969C",
        faint: "#A0AAAF",
        tint: {
          DEFAULT: "#EEF3F4",
          soft: "#FBFCFC",
          row: "#FAFBFB",
          chip: "#EEF1F2",
        },
        success: {
          DEFAULT: "#205C42",
          dot: "#2E6B4F",
          bg: "#E7F1EC",
        },
        warn: {
          DEFAULT: "#8A6516",
          ink: "#7A5A12",
          bg: "#FBF3E2",
          line: "#F0E0BC",
          mark: "#C79A3C",
        },
        danger: "#B83C3C",
        toast: "#16242B",
      },
      fontFamily: {
        sans: [
          "var(--font-public-sans)",
          "Public Sans",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "monospace"],
      },
      keyframes: {
        wave: {
          "0%,100%": { transform: "scaleY(.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        pulse: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        wave: "wave 0.9s ease-in-out infinite",
        "pulse-slow": "pulse 1.4s ease-in-out infinite",
        spin: "spin 0.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
