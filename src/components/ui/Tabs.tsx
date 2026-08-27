import { useCallback, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * A tab strip, built to the ARIA tabs pattern: arrow keys move between tabs, Home
 * and End jump to the ends, and only the selected tab is in the page's tab order.
 *
 * Simulations need this because the depth has to go *somewhere*. The old layout was
 * a fixed two-column grid — stage on the left, one undifferentiated scroll of
 * sliders on the right — with no room for theory, worked formulas, a data table or
 * a tutor. Tabs let all of that exist without burying the controls.
 */

export interface TabItem {
  id: string
  label: string
  /** Small count or status beside the label, e.g. the number of questions. */
  badge?: string | number
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  /** Tab shown first. Defaults to the first enabled tab. */
  initialId?: string
  onChange?: (id: string) => void
  /**
   * Render every panel and hide the inactive ones. Costs more, but preserves
   * scroll position and any local state inside a panel.
   */
  keepMounted?: boolean
  className?: string
  /** Accessible name for the tab strip. */
  label: string
}

export default function Tabs({
  items,
  initialId,
  onChange,
  keepMounted = false,
  className,
  label
}: TabsProps) {
  const baseId = useId()
  const enabled = items.filter((item) => !item.disabled)
  const [activeId, setActiveId] = useState(() => initialId ?? enabled[0]?.id ?? items[0]?.id ?? '')
  const stripRef = useRef<HTMLDivElement>(null)

  const select = useCallback(
    (id: string) => {
      setActiveId(id)
      onChange?.(id)
    },
    [onChange]
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const order = items.filter((item) => !item.disabled).map((item) => item.id)
      const index = order.indexOf(activeId)
      if (index < 0) return

      let next: string | undefined
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = order[(index + 1) % order.length]
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = order[(index - 1 + order.length) % order.length]
      else if (event.key === 'Home') next = order[0]
      else if (event.key === 'End') next = order[order.length - 1]
      if (!next) return

      event.preventDefault()
      select(next)
      // Move focus with the selection, as the tabs pattern requires — otherwise a
      // further arrow press would act on the tab the student has left behind.
      const button = stripRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(`${baseId}-tab-${next}`)}`)
      button?.focus()
    },
    [items, activeId, select, baseId]
  )

  return (
    <div className={`tabs${className ? ` ${className}` : ''}`}>
      <div className="tabs__strip" role="tablist" aria-label={label} ref={stripRef} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const selected = item.id === activeId
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className={selected ? 'tabs__tab tabs__tab--active' : 'tabs__tab'}
              onClick={() => select(item.id)}
            >
              {item.label}
              {item.badge !== undefined ? <span className="tabs__badge">{item.badge}</span> : null}
            </button>
          )
        })}
      </div>

      {items.map((item) => {
        const selected = item.id === activeId
        if (!keepMounted && !selected) return null
        return (
          <div
            key={item.id}
            id={`${baseId}-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${item.id}`}
            className="tabs__panel"
            hidden={!selected}
            tabIndex={0}
          >
            {item.content}
          </div>
        )
      })}
    </div>
  )
}
