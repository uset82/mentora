import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        mentora: {
          canvas: "var(--mentora-canvas)",
          surface: "var(--mentora-surface)",
          strong: "var(--mentora-surface-strong)",
          text: "var(--mentora-text)",
          copy: "var(--mentora-copy)",
          muted: "var(--mentora-muted)",
          primary: "var(--mentora-primary)",
          cyan: "var(--mentora-cyan)",
        },
      },
      borderRadius: {
        mentora: "var(--mentora-glass-radius)",
      },
      boxShadow: {
        mentora: "var(--mentora-glass-shadow)",
      },
    },
  },
};

export default config;
