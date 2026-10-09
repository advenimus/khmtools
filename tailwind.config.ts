import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

const TOKENS = [
  "bg",
  "surface",
  "surface-2",
  "border",
  "text",
  "text-mute",
  "brand",
  "brand-hover",
  "brand-solid",
  "brand-solid-hover",
  "success",
  "warning",
  "danger",
  "danger-solid",
  "control-off",
];

export default {
  content: ["./index.html", "./src/**/*.{svelte,ts,js}"],
  theme: {
    extend: {
      colors: Object.fromEntries(TOKENS.map((t) => [t, token(t)])),
      boxShadow: {
        soft: "var(--shadow)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
