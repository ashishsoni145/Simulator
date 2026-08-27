import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { decimalsForStep, roundToStep } from '../../science/units'

/**
 * Controls a student can drive precisely.
 *
 * The slider this replaces displayed its value with `toFixed(step < 1 ? 2 : 0)`,
 * so a 0.005-step control showed both 0.005 and 0.015 as "0.01" — you could move
 * it and watch the number not change. It also had no way to enter an exact value,
 * no visible range, and no notion of a value worth marking. All four are fixed
 * here: `decimalsForStep` derives the precision from the step, a number box accepts
 * typed input, the ends of the range are labelled, and `marks` can pin the values
 * that matter (45° for maximum range, 1.0 for a critically damped oscillator).
 */

export interface SliderMark {
  value: number
  label?: string
}

export interface SliderProps {
  label: string
  /** The symbol used for this quantity in the formulas, e.g. `θ`. */
  symbol?: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
  /** Values worth pointing out, drawn as ticks under the track. */
  marks?: readonly SliderMark[]
  /** One line explaining what the quantity does. */
  help?: string
  disabled?: boolean
  /** Offer a number box for exact entry. Default true. */
  editable?: boolean
  className?: string
}

export function Slider({
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  marks,
  help,
  disabled = false,
  editable = true,
  className
}: SliderProps) {
  const id = useId()
  const decimals = useMemo(() => decimalsForStep(step), [step])
  const display = useMemo(() => value.toFixed(decimals), [value, decimals])

  // The text box keeps its own draft while being typed into, so a half-finished
  // "1." or "-" is not immediately parsed to NaN and snapped away under the caret.
  const [draft, setDraft] = useState(display)
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setDraft(display)
  }, [display, editing])

  const commit = useCallback(
    (raw: string) => {
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) {
        setDraft(display)
        return
      }
      const clamped = Math.min(max, Math.max(min, parsed))
      onChange(roundToStep(clamped, step))
    },
    [display, max, min, onChange, step]
  )

  const percentFor = (target: number) => ((target - min) / (max - min || 1)) * 100

  return (
    <div className={`control${disabled ? ' control--disabled' : ''}${className ? ` ${className}` : ''}`}>
      <div className="control__head">
        <label className="control__label" htmlFor={id}>
          {label}
          {symbol ? <span className="control__symbol">{symbol}</span> : null}
        </label>

        {editable ? (
          <span className="control__entry">
            <input
              className="control__number"
              type="number"
              inputMode="decimal"
              value={draft}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              aria-label={`${label} exact value`}
              onFocus={() => setEditing(true)}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={(event) => {
                setEditing(false)
                commit(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commit((event.target as HTMLInputElement).value)
                  ;(event.target as HTMLInputElement).blur()
                }
              }}
            />
            {unit ? <span className="control__unit">{unit}</span> : null}
          </span>
        ) : (
          <strong className="control__value">
            {display}
            {unit ? <span className="control__unit">{unit}</span> : null}
          </strong>
        )}
      </div>

      <div className="control__track-wrap">
        <input
          id={id}
          className="control__range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={unit ? `${display} ${unit}` : display}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {marks && marks.length > 0 ? (
          <div className="control__marks" aria-hidden="true">
            {marks.map((mark) => (
              <span
                key={mark.value}
                className="control__mark"
                style={{ left: `${Math.min(100, Math.max(0, percentFor(mark.value)))}%` }}
              >
                {mark.label ? <span className="control__mark-label">{mark.label}</span> : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="control__bounds" aria-hidden="true">
        <span>{min.toFixed(decimals)}</span>
        <span>{max.toFixed(decimals)}</span>
      </div>

      {help ? <p className="control__help">{help}</p> : null}
    </div>
  )
}

export interface SelectProps<T extends string> {
  label: string
  value: T
  options: ReadonlyArray<{ label: string; value: T; description?: string }>
  onChange: (value: T) => void
  help?: string
  disabled?: boolean
}

export function Select<T extends string>({ label, value, options, onChange, help, disabled }: SelectProps<T>) {
  const id = useId()
  return (
    <div className={`control${disabled ? ' control--disabled' : ''}`}>
      <div className="control__head">
        <label className="control__label" htmlFor={id}>
          {label}
        </label>
      </div>
      <select
        id={id}
        className="control__select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help ?? options.find((option) => option.value === value)?.description ? (
        <p className="control__help">{help ?? options.find((option) => option.value === value)?.description}</p>
      ) : null}
    </div>
  )
}

export interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  help?: string
  disabled?: boolean
}

export function Toggle({ label, checked, onChange, help, disabled }: ToggleProps) {
  const id = useId()
  return (
    <div className={`control control--toggle${disabled ? ' control--disabled' : ''}`}>
      <label className="control__toggle-row" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="control__checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="control__switch" aria-hidden="true" />
        <span className="control__label">{label}</span>
      </label>
      {help ? <p className="control__help">{help}</p> : null}
    </div>
  )
}

export interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: ReadonlyArray<{ label: string; value: T; title?: string }>
  onChange: (value: T) => void
  /** Hide the visible label, keeping it for screen readers. */
  hideLabel?: boolean
}

/** A radio group that reads as a row of buttons. For 2–4 mutually exclusive modes. */
export function Segmented<T extends string>({ label, value, options, onChange, hideLabel }: SegmentedProps<T>) {
  return (
    <div className="segmented-wrap">
      <span className={hideLabel ? 'visually-hidden' : 'control__label'} id={`${label}-legend`}>
        {label}
      </span>
      <div className="segmented" role="radiogroup" aria-labelledby={`${label}-legend`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            title={option.title}
            className={option.value === value ? 'segmented__item segmented__item--active' : 'segmented__item'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface PlaybackProps {
  playing: boolean
  onToggle: () => void
  onReset: () => void
  onStep?: () => void
  speed?: number
  onSpeed?: (speed: number) => void
  /** 0..1 for the progress bar; omit for an open-ended clock. */
  progress?: number
  /** Current and total time, formatted, shown beside the buttons. */
  timeLabel?: string
  children?: ReactNode
}

const SPEEDS = [0.25, 0.5, 1, 2] as const

/** Play / step / reset, a speed selector, and an elapsed-time readout. */
export function Playback({
  playing,
  onToggle,
  onReset,
  onStep,
  speed,
  onSpeed,
  progress,
  timeLabel,
  children
}: PlaybackProps) {
  return (
    <div className="playback" aria-label="Playback controls">
      <div className="playback__buttons">
        <button className="button button--primary" type="button" onClick={onToggle}>
          {playing ? 'Pause' : 'Play'}
        </button>
        {onStep ? (
          <button className="button button--ghost" type="button" onClick={onStep} title="Advance one frame">
            Step
          </button>
        ) : null}
        <button className="button button--ghost" type="button" onClick={onReset}>
          Reset
        </button>
        {timeLabel ? <span className="playback__time">{timeLabel}</span> : null}
      </div>

      {progress !== undefined ? (
        <div className="playback__progress" role="presentation">
          <span style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
        </div>
      ) : null}

      {onSpeed && speed !== undefined ? (
        <Segmented
          label="Playback speed"
          hideLabel
          value={String(speed)}
          options={SPEEDS.map((option) => ({ label: `${option}×`, value: String(option) }))}
          onChange={(next) => onSpeed(Number(next))}
        />
      ) : null}

      {children}
    </div>
  )
}
