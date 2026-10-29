import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        product: ["'Space Mono'", "monospace"],
        portal: ["Figtree", "system-ui", "sans-serif"],
        "portal-display": ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        partner: {
          // Enterprise mono palette: near-black ink + neutral greys.
          // Pink is the single rare accent (<5% of visible area).
          pink: "#FF4D8D",
          "pink-hover": "#E63E78",
          teal: "#475569", // neutral slate — no longer a second accent
          navy: "#111317", // near-black ink (primary dark)
          bg: "#F7F8FA",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          alt: "hsl(var(--background-alt))",
        },
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        cta: {
          DEFAULT: "hsl(var(--cta))",
          foreground: "hsl(var(--cta-foreground))",
          hover: "hsl(var(--cta-hover))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: "hsl(var(--success))",
        info: "hsl(var(--info))",
        disabled: "hsl(var(--disabled))",
        status: {
          ontrack: "hsl(var(--status-ontrack))",
          "ontrack-surface": "hsl(var(--status-ontrack-surface))",
          atrisk: "hsl(var(--status-atrisk))",
          "atrisk-surface": "hsl(var(--status-atrisk-surface))",
          blocked: "hsl(var(--status-blocked))",
          "blocked-surface": "hsl(var(--status-blocked-surface))",
          neutral: "hsl(var(--status-neutral))",
          "neutral-surface": "hsl(var(--status-neutral-surface))",
        },
        "ai-signal": {
          DEFAULT: "hsl(var(--ai-signal))",
          foreground: "hsl(var(--ai-signal-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
      },
      spacing: {
        /* 8pt-based touch targets (Principles 23, 46) */
        "touch": "3rem",      /* 48px min */
        "touch-lg": "3.5rem", /* 56px field-critical */
        "touch-xl": "4rem",   /* 64px SOS/primary field */
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-bottom": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "impact-ripple": {
          "0%": { transform: "scale(1)", boxShadow: "0 0 0 0 hsl(var(--primary) / 0.7)" },
          "50%": { transform: "scale(1.02)", boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
          "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
        },
        "scroll-x": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "neural-flow": {
          "0%": { strokeDashoffset: "40" },
          "100%": { strokeDashoffset: "0" },
        },
        "at-field": {
          "0%": { transform: "scale(0.55)", opacity: "0.7" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        "sync-core": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.12)", opacity: "0.85" },
        },
        "sync-flicker": {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.45" },
          "55%": { opacity: "0.9" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-left": "fade-in-left 0.6s ease-out forwards",
        "fade-in-right": "fade-in-right 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "count-up": "count-up 0.8s ease-out forwards",
        "slide-in-bottom": "slide-in-bottom 0.8s ease-out forwards",
        "draw-line": "draw-line 1.5s ease-out forwards",
        "impact-ripple": "impact-ripple 2s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
        "scroll-x": "scroll-x 30s linear infinite",
        "neural-flow": "neural-flow 1.2s linear infinite",
        "at-field": "at-field 2.8s ease-out infinite",
        "sync-core": "sync-core 2.2s ease-in-out infinite",
        "sync-flicker": "sync-flicker 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
