/**
 * ACME HR design tokens — "Harbor Ink"
 *
 * Cool mist surfaces, deep teal brand, warm gold accents.
 * CSS variables in theme.css are the source of truth; this file
 * mirrors them for typed JS/TS usage (inline styles, charts, etc.).
 */

export const theme = {
  fonts: {
    display: 'var(--font-display)',
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  colors: {
    canvas: 'var(--color-canvas)',
    canvasMuted: 'var(--color-canvas-muted)',
    surface: 'var(--color-surface)',
    surfaceRaised: 'var(--color-surface-raised)',
    ink: 'var(--color-ink)',
    inkMuted: 'var(--color-ink-muted)',
    inkSubtle: 'var(--color-ink-subtle)',
    brand: 'var(--color-brand)',
    brandStrong: 'var(--color-brand-strong)',
    brandSoft: 'var(--color-brand-soft)',
    accent: 'var(--color-accent)',
    accentSoft: 'var(--color-accent-soft)',
    border: 'var(--color-border)',
    borderStrong: 'var(--color-border-strong)',
    danger: 'var(--color-danger)',
    dangerSoft: 'var(--color-danger-soft)',
    success: 'var(--color-success)',
    successSoft: 'var(--color-success-soft)',
    warning: 'var(--color-warning)',
    warningSoft: 'var(--color-warning-soft)',
    focusRing: 'var(--color-focus-ring)',
  },
  space: {
    0: 'var(--space-0)',
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
    10: 'var(--space-10)',
    12: 'var(--space-12)',
    16: 'var(--space-16)',
    section: 'var(--space-section)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },
  border: {
    hairline: 'var(--border-hairline)',
    default: 'var(--border-default)',
    thick: 'var(--border-thick)',
  },
  shadow: {
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    focus: 'var(--shadow-focus)',
  },
  motion: {
    durationFast: 'var(--duration-fast)',
    durationBase: 'var(--duration-base)',
    durationSlow: 'var(--duration-slow)',
    easeOut: 'var(--ease-out)',
    easeInOut: 'var(--ease-in-out)',
    easeSpring: 'var(--ease-spring)',
  },
} as const;

export type Theme = typeof theme;
