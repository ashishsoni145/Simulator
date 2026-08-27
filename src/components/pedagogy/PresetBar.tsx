/**
 * Named scenarios.
 *
 * A blank set of sliders is a bad starting point: a student who does not yet know
 * what the simulation is *for* has no way to pick good values, and the interesting
 * configurations — the 45° optimum, the two complementary angles that tie, a
 * perfectly elastic collision — are exactly the ones they will not stumble onto.
 * A preset is a one-click way into a question worth asking.
 */

export interface Preset<Params> {
  id: string
  label: string
  /** What this configuration demonstrates, in a few words. */
  description?: string
  values: Params
}

export interface PresetBarProps<Params> {
  presets: ReadonlyArray<Preset<Params>>
  onApply: (values: Params, preset: Preset<Params>) => void
  /** Id of the preset whose values are currently in force, if any. */
  activeId?: string | null
  label?: string
  className?: string
}

export default function PresetBar<Params>({
  presets,
  onApply,
  activeId,
  label = 'Scenarios',
  className
}: PresetBarProps<Params>) {
  if (presets.length === 0) return null

  return (
    <div className={`presets${className ? ` ${className}` : ''}`}>
      <span className="presets__label" id="presets-label">
        {label}
      </span>
      <div className="presets__list" role="group" aria-labelledby="presets-label">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activeId === preset.id ? 'presets__item presets__item--active' : 'presets__item'}
            onClick={() => onApply(preset.values, preset)}
            title={preset.description}
            aria-pressed={activeId === preset.id}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {activeId ? (
        <p className="presets__description">
          {presets.find((preset) => preset.id === activeId)?.description ?? ''}
        </p>
      ) : null}
    </div>
  )
}
