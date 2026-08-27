/**
 * The palette, as a type.
 *
 * Every instrument, series and callout picks a tone rather than a hex value, so a
 * simulation cannot hard-code `#7dd3fc` and then drift when the theme changes.
 * The names match the CSS custom properties in index.css.
 */
export type Tone = 'cyan' | 'blue' | 'green' | 'amber' | 'violet' | 'danger' | 'muted'

/**
 * The order series are coloured in when a caller does not choose. Ordered for
 * contrast between *adjacent* pairs, since a two-series chart is the common case.
 */
export const TONE_CYCLE: readonly Tone[] = ['cyan', 'amber', 'green', 'violet', 'blue', 'danger']

/** The CSS variable reference for a tone, usable directly as a `stroke` or `fill`. */
export function toneVar(tone: Tone): string {
  return `var(--${tone})`
}

/** The tone for series `index`, cycling if there are more series than tones. */
export function toneForIndex(index: number): Tone {
  return TONE_CYCLE[index % TONE_CYCLE.length] as Tone
}
