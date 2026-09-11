import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // NOTE: the 1240px content width ships as the opt-in `max-w-container`
    // utility (and `--container-max`) rather than as a `theme.container`
    // override. `.container` is used in 62 places including Navbar.tsx, and
    // capping it globally makes the desktop nav overflow and wrap
    // ("Client Login" breaks onto two lines, header grows taller). Adopting
    // 1240px site-wide needs matching nav changes, which belong to the
    // component wave — not to this tokens-only PR.
    // `colors.card` (shadcn) and `boxShadow.card` (new token) both claim the
    // class `shadow-card`. The boxShadowColor plugin is registered later, so it
    // would win and paint the shadow white (hsl(var(--card))), silently erasing
    // the elevation token. Drop only `card` from the shadow-color palette.
    boxShadowColor: ({ theme }: { theme: (k: string) => Record<string, unknown> }) => {
      const { card: _card, ...rest } = theme("colors");
      return rest;
    },
    extend: {
      maxWidth: {
        container: "1240px",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      fontSize: {
        h1: ["clamp(2.5rem, 5vw, 3.75rem)", { lineHeight: "1.12", letterSpacing: "-0.025em", fontWeight: "700" }],
        h2: ["clamp(2rem, 3.5vw, 2.75rem)", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        h3: ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        body: ["0.9375rem", { lineHeight: "1.55", fontWeight: "400" }],
        caption: ["0.8125rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 23, 42, .05)",
        card: "0 4px 6px -1px rgba(15, 23, 42, .05), 0 2px 4px -2px rgba(15, 23, 42, .03)",
        "card-hover": "0 12px 24px -4px rgba(15, 23, 42, .08), 0 4px 8px -2px rgba(15, 23, 42, .04)",
        flyout: "0 20px 30px -10px rgba(15, 23, 42, .12), 0 8px 12px -4px rgba(15, 23, 42, .06)",
      },
      backgroundImage: {
        "hero-mesh": "var(--gradient-hero-mesh)",
        "dark-banner": "var(--gradient-dark-banner)",
      },
      colors: {
        // --- Design-token brand scale (additive; --accent stays Canadian red) ---
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          primary: "hsl(var(--brand) / <alpha-value>)",
          hover: "hsl(var(--brand-hover) / <alpha-value>)",
          active: "hsl(var(--brand-active) / <alpha-value>)",
          subtle: "hsl(var(--brand-subtle) / <alpha-value>)",
          border: "hsl(var(--brand-border) / <alpha-value>)",
          electric: "hsl(var(--brand-electric) / <alpha-value>)",
          success: "hsl(var(--status-success) / <alpha-value>)",
        },
        surface: {
          primary: "hsl(var(--background) / <alpha-value>)",
          secondary: "hsl(var(--surface-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--surface-tertiary) / <alpha-value>)",
          dark: "hsl(var(--surface-dark) / <alpha-value>)",
          "dark-card": "hsl(var(--surface-dark-card) / <alpha-value>)",
        },
        text: {
          primary: "hsl(var(--foreground) / <alpha-value>)",
          secondary: "hsl(var(--muted-foreground) / <alpha-value>)",
          muted: "hsl(var(--text-muted-hsl) / <alpha-value>)",
          inverse: "hsl(0 0% 100% / <alpha-value>)",
        },
        badge: {
          bg: "hsl(var(--badge-bg-hsl) / <alpha-value>)",
          text: "hsl(var(--badge-text-hsl) / <alpha-value>)",
        },
        // --- shadcn contract (unchanged keys) ---
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: {
          DEFAULT: "hsl(var(--border) / <alpha-value>)",
          subtle: "hsl(var(--border) / <alpha-value>)",
          strong: "hsl(var(--border-strong-hsl) / <alpha-value>)",
          focus: "hsl(var(--ring) / <alpha-value>)",
          "card-hover": "hsl(var(--border-card-hover-hsl) / <alpha-value>)",
        },
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
