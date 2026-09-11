import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // NOTE: the 1328px outer width ships as the opt-in `max-w-container-outer`
    // / `max-w-container` utilities (and `--container-*`) rather than as a
    // `theme.container` override. `.container` is used in 62 places including
    // Navbar.tsx, and capping it globally makes the desktop nav overflow and
    // wrap ("Client Login" breaks onto two lines, header grows taller).
    // Adopting the measured width site-wide needs matching nav changes, which
    // belong to the component wave — not to this tokens-only PR.
    //
    // boxShadowColor guard: any key present in BOTH `colors` and `boxShadow`
    // is claimed by two plugins for the same class, and boxShadowColor is
    // registered later — it wins and repaints the elevation as a shadow
    // COLOUR, silently erasing the shadow. `card` is the live collision here.
    // Keep this guard when adding shadow tokens.
    boxShadowColor: ({ theme }: { theme: (k: string) => Record<string, unknown> }) => {
      const { card: _card, ...rest } = theme("colors");
      return rest;
    },
    extend: {
      maxWidth: {
        container: "1280px",         /* content */
        "container-outer": "1328px", /* outer shell incl. 2 x 24px gutters */
      },
      borderRadius: {
        // Concentric and arithmetic: outer 12px - 4px padding = 8px child;
        // 8px - 2px padding = 6px child. Subtract padding, don't eyeball.
        sm: "6px",
        md: "8px",
        lg: "12px",
      },
      fontSize: {
        // Measured from the reference. Letter-spacing is given in px, as
        // measured; it works out to -0.04em on h1/h2, 0 in the middle of the
        // scale, and +0.175em on the 12px uppercase eyebrow.
        h1: ["54px", { lineHeight: "65px", letterSpacing: "-2.16px", fontWeight: "700" }],
        // 375px variant — pair as `text-h1-sm md:text-h1` in the component wave.
        "h1-sm": ["48px", { lineHeight: "52px", letterSpacing: "-1.92px", fontWeight: "700" }],
        h2: ["32px", { lineHeight: "40px", letterSpacing: "-1.28px", fontWeight: "700" }],
        h3: ["16px", { lineHeight: "19.2px", fontWeight: "600" }],
        lead: ["18px", { lineHeight: "25.2px", fontWeight: "400" }],
        body: ["14px", { lineHeight: "19.6px", fontWeight: "400" }],
        // `uppercase` is applied as a separate class; fontSize cannot set it.
        eyebrow: ["12px", { lineHeight: "18px", letterSpacing: "2.1px", fontWeight: "600" }],
      },
      boxShadow: {
        // Exactly three. `lifted` is deliberately blue-grey tinted, not black.
        sm: "0 2px 6px rgba(0, 0, 0, .04)",
        md: "0 8px 24px rgba(0, 0, 0, .04)",
        lifted: "0 4px 24px rgba(165, 176, 204, .20)",
      },
      transitionDuration: {
        DEFAULT: "300ms",
        state: "200ms",
      },
      colors: {
        // --- Design tokens (additive; --accent stays Canadian red) ---
        // #3356EE is the ONE accent: selection, focus, link hover. Sparing use.
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          accent: "hsl(var(--brand) / <alpha-value>)",
          hover: "hsl(var(--brand-hover) / <alpha-value>)",
        },
        surface: {
          primary: "hsl(var(--background) / <alpha-value>)",
          recessed: "hsl(var(--surface-recessed) / <alpha-value>)",
          canvas: "hsl(var(--surface-canvas) / <alpha-value>)",
          "hero-wash": "hsl(var(--surface-hero-wash) / <alpha-value>)",
          dark: "hsl(var(--surface-dark) / <alpha-value>)",
        },
        text: {
          primary: "hsl(var(--foreground) / <alpha-value>)",
          secondary: "hsl(var(--muted-foreground) / <alpha-value>)",
          muted: "hsl(var(--text-muted-hsl) / <alpha-value>)",
          deemphasis: "hsl(var(--text-deemphasis-hsl) / <alpha-value>)",
          inverse: "hsl(0 0% 100% / <alpha-value>)",
        },
        // --- shadcn contract (unchanged keys) ---
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: {
          DEFAULT: "hsl(var(--border) / <alpha-value>)",
          hairline: "hsl(var(--border) / <alpha-value>)",
          control: "hsl(var(--border-control-hsl) / <alpha-value>)",
          app: "hsl(var(--border-app-hsl) / <alpha-value>)",
          focus: "hsl(var(--ring) / <alpha-value>)",
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
