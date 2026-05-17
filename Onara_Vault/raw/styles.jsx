/**
 * ONARA — DESIGN TOKENS (Dashboard / Marketing app theme)
 * Step 9 of the 30-Step Roadmap
 *
 * This file ONLY defines the Onara app theme — the paper-aesthetic
 * dashboard, marketing site, auth, and build flow.
 *
 * It does NOT define the palettes used by Agent 3 to style USER-generated
 * sites. Those live in pipeline/agents/style_palettes.py.
 *
 * Aesthetic: warm paper whites, charcoal ink, terracotta accent,
 * Fraunces serif for display, Inter for UI, JetBrains Mono for labels,
 * Caveat for the hand-drawn marketing accents.
 */


/* ============================================================
   TAILWIND CONFIG
   File: tailwind.config.js (Next.js app root)
   ============================================================ */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* --- Colors --- */
      colors: {
        /* Warm off-white "paper" backgrounds — tinted slightly yellow.
           Used for: app background, cards, panel surfaces. */
        paper: {
          DEFAULT: '#faf8f3',   /* oklch(0.985 0.006 80) — base */
          2:       '#f4f1ea',   /* oklch(0.965 0.008 80) — section bg */
          3:       '#ebe7df',   /* oklch(0.945 0.010 80) — hover / pressed */
        },

        /* Ink — text + hard borders. Charcoal, never pure black. */
        ink: {
          DEFAULT: '#1a1a1a',
          2:       '#3b3b3b',   /* body */
          3:       '#6a6a6a',   /* secondary text, mono labels */
          4:       '#a8a8a3',   /* tertiary, placeholders */
          5:       '#cfcfc7',   /* disabled, pending dots */
        },

        /* Rule lines — hairlines used to separate sections. */
        rule: {
          DEFAULT: '#d8d6cf',   /* primary hairline */
          2:       '#ebeae4',   /* softer hairline */
        },

        /* Terracotta accent — Onara's primary brand color.
           Used for: primary CTAs, active states, links, highlights. */
        accent: {
          DEFAULT: '#c2541f',   /* oklch(0.62 0.13 50) */
          2:       '#a8451e',   /* oklch(0.56 0.14 45) — hover */
          soft:    '#f3e0cf',   /* oklch(0.93 0.05 60) — fill on light bg */
          softer:  '#f7ecdb',   /* oklch(0.96 0.03 65) — info / trial panels */
          ink:     '#6e4424',   /* oklch(0.42 0.10 50) — accent text on light */
        },

        /* Semantic helpers. */
        leaf:    '#5a7d5a',     /* oklch(0.55 0.08 145) — success / live state */
        warn:    '#d8a85a',     /* oklch(0.78 0.10 80) */
        warnBg:  '#f1e6c8',     /* oklch(0.94 0.05 85) */

        /* Aliases matched to the proto.css variable names so existing
           styles (var(--ink), var(--accent-ink) etc.) port over cleanly. */
        surface: {
          0:   '#ffffff',
          50:  '#faf8f3',
          100: '#f4f1ea',
          200: '#ebe7df',
        },
        text: {
          primary:   '#1a1a1a',
          secondary: '#6a6a6a',
          muted:     '#a8a8a3',
          inverse:   '#faf8f3',
        },
        success: '#5a7d5a',
        warning: '#d8a85a',
        error:   '#b8423a',
        info:    '#6e4424',
      },

      /* --- Typography ---
         Display: Fraunces (serif, optical-size enabled).
         UI:      Inter.
         Mono:    JetBrains Mono — used for eyebrows, labels, status text.
         Hand:    Caveat — sparingly, for handwritten marketing accents. */
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        ui:      ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['Fraunces', 'Georgia', 'serif'],
        heading: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        hand:    ['Caveat', 'cursive'],
      },
      fontSize: {
        /* mono labels / eyebrows are 11px with wide tracking */
        'mono':       ['0.6875rem', { lineHeight: '1rem',    letterSpacing: '0.08em' }],
        'eyebrow':    ['0.6875rem', { lineHeight: '1rem',    letterSpacing: '0.12em' }],
        'xs':         ['0.75rem',   { lineHeight: '1rem' }],
        'sm':         ['0.875rem',  { lineHeight: '1.25rem' }],
        'base':       ['1rem',      { lineHeight: '1.5rem' }],
        'lg':         ['1.125rem',  { lineHeight: '1.6rem' }],
        'xl':         ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl':        ['1.5rem',    { lineHeight: '1.85rem' }],
        '3xl':        ['1.875rem',  { lineHeight: '2.15rem' }],
        /* display sizes — tighter line-height for the Fraunces headlines */
        '4xl':        ['2.25rem',   { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        '5xl':        ['3rem',      { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        '6xl':        ['3.5rem',    { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        '7xl':        ['4.5rem',    { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        '8xl':        ['5.75rem',   { lineHeight: '0.96', letterSpacing: '-0.035em' }],
      },
      fontWeight: {
        light:    '300',
        normal:   '400',
        medium:   '500',
        semibold: '600',
        bold:     '700',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter:  '-0.025em',
        tight:    '-0.015em',
        normal:   '0',
        wide:     '0.04em',
        wider:    '0.08em',
        widest:   '0.12em',
      },

      /* --- Spacing Scale --- */
      spacing: {
        '0':  '0',
        '1':  '0.25rem',   /*  4px */
        '2':  '0.5rem',    /*  8px */
        '3':  '0.75rem',   /* 12px */
        '4':  '1rem',      /* 16px */
        '5':  '1.25rem',   /* 20px */
        '6':  '1.5rem',    /* 24px */
        '7':  '1.75rem',   /* 28px */
        '8':  '2rem',      /* 32px */
        '10': '2.5rem',    /* 40px */
        '12': '3rem',      /* 48px */
        '14': '3.5rem',    /* 56px */
        '16': '4rem',      /* 64px */
        '20': '5rem',      /* 80px */
        '24': '6rem',      /* 96px */
        '30': '7.5rem',    /* 120px */
      },

      /* --- Border Radius ---
         Onara uses sharp/low radii — the paper aesthetic feels printed,
         not "app-y". Default is 4px, cards 6px, only pills go full. */
      borderRadius: {
        'none':    '0',
        'sm':      '2px',
        DEFAULT:   '4px',
        'md':      '4px',
        'lg':      '6px',
        'xl':      '8px',
        '2xl':     '12px',
        'full':    '9999px',
      },

      /* --- Shadows ---
         Soft, warm-tinted shadows — never the default Tailwind cool grey. */
      boxShadow: {
        'sm':    '0 1px 3px rgba(20,16,10,0.06)',
        DEFAULT: '0 4px 16px rgba(20,16,10,0.06)',
        'md':    '0 8px 24px rgba(20,16,10,0.07)',
        'lg':    '0 14px 40px -8px rgba(20,16,10,0.10)',
        'xl':    '0 30px 80px -10px rgba(20,16,10,0.18), 0 8px 24px -8px rgba(20,16,10,0.08)',
        'modal': '0 30px 80px rgba(20,16,10,0.18)',
        'inset-rule': 'inset 0 -1px 0 #ebeae4',
        'none':  'none',
      },

      /* --- Transitions --- */
      transitionDuration: {
        DEFAULT: '150ms',
        fast:    '120ms',
        slow:    '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      /* --- Z-Index Scale --- */
      zIndex: {
        behind:   '-1',
        base:     '0',
        raised:   '10',
        nav:      '20',
        dropdown: '100',
        sticky:   '200',
        overlay:  '300',
        modal:    '400',
        toast:    '500',
      },

      /* --- Containers --- */
      maxWidth: {
        'app':     '1200px',
        'content': '780px',
        'narrow':  '480px',
        'reading': '660px',
      },

      /* --- Animations ---
         The marketing site uses three core motion primitives:
         shimmer (loading), fadein-up (entry), pulse-on (live dot). */
      keyframes: {
        'fadein-up': {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'pulse-on': {
          '0%, 100%': { boxShadow: '0 0 0 3px rgba(194,84,31,0.18)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(194,84,31,0.00)' },
        },
        'marquee': {
          'from': { transform: 'translateX(0)' },
          'to':   { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fadein-up': 'fadein-up 0.4s ease both',
        'shimmer':   'shimmer 1.8s linear infinite',
        'pulse-on':  'pulse-on 1.6s ease-in-out infinite',
        'marquee':   'marquee 40s linear infinite',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
