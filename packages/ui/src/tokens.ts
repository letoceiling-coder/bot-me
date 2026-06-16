/** Design tokens from DESIGN.md — use in Tailwind theme extension */
export const tokens = {
  colors: {
    base: "#070B14",
    elevated: "#0E1524",
    surface: "#141E32",
    muted: "#1A2740",
    textPrimary: "#F4F7FB",
    textSecondary: "#9AADCC",
    textMuted: "#6B7F9E",
    accent: "#2DD4BF",
    accentHover: "#14B8A6",
    gold: "#E8C468",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
  },
  radius: {
    button: "10px",
    card: "14px",
    modal: "20px",
  },
  font: {
    display: "Manrope, system-ui, sans-serif",
    body: "Onest, system-ui, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
} as const;

export type Tokens = typeof tokens;
