interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}

export function SliderControl({ label, value, min, max, step, unit, onChange }: SliderProps) {
  return (
    <label className="control">
      <span className="control__label">
        <span>{label}</span>
        <strong>
          {value.toFixed(step < 1 ? 2 : 0)} {unit}
        </strong>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

interface NumberControlProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

export function NumberControl({ label, value, min, max, step = 1, unit, onChange }: NumberControlProps) {
  return (
    <label className="control">
      <span className="control__label">
        <span>{label}</span>
        <span>{unit}</span>
      </span>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

interface SelectControlProps<T extends string> {
  label: string
  value: T
  options: { label: string; value: T }[]
  onChange: (value: T) => void
}

export function SelectControl<T extends string>({ label, value, options, onChange }: SelectControlProps<T>) {
  return (
    <label className="control">
      <span className="control__label">
        <span>{label}</span>
      </span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PlayResetControls({
  playing,
  onToggle,
  onReset,
  onStep
}: {
  playing: boolean
  onToggle: () => void
  onReset: () => void
  onStep?: () => void
}) {
  return (
    <div className="toolbar" aria-label="Playback controls">
      <button className="button button--primary" type="button" onClick={onToggle}>
        {playing ? 'Pause' : 'Play'}
      </button>
      {onStep ? (
        <button className="button button--ghost" type="button" onClick={onStep}>
          Step
        </button>
      ) : null}
      <button className="button button--ghost" type="button" onClick={onReset}>
        Reset
      </button>
    </div>
  )
}
