export const designTokens = {
  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans)",
      mono: "var(--font-geist-mono)",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
    },
    lineHeight: {
      tight: "1.1",
      snug: "1.25",
      normal: "1.5",
      relaxed: "1.625",
    },
  },
  spacing: {
    page: "1rem",
    section: "4rem",
    sectionLg: "6rem",
    stack: "1.5rem",
    gutter: "2rem",
  },
  radius: {
    sm: "calc(var(--radius) - 4px)",
    md: "calc(var(--radius) - 2px)",
    lg: "var(--radius)",
    xl: "calc(var(--radius) + 4px)",
    "2xl": "calc(var(--radius) + 8px)",
  },
  shadow: {
    sm: "0 1px 2px rgb(0 0 0 / 0.05)",
    md: "0 8px 24px rgb(0 0 0 / 0.08)",
    lg: "0 16px 40px rgb(0 0 0 / 0.12)",
  },
  animation: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  container: {
    sm: "40rem",
    md: "48rem",
    lg: "64rem",
    xl: "80rem",
    "2xl": "96rem",
  },
  breakpoint: {
    sm: "40rem",
    md: "48rem",
    lg: "64rem",
    xl: "80rem",
    "2xl": "96rem",
  },
} as const;

export type DesignTokens = typeof designTokens;
