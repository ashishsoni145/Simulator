export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '∞'
  if (Math.abs(value) >= 100000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
    return value.toExponential(2)
  }
  return value.toFixed(digits)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
