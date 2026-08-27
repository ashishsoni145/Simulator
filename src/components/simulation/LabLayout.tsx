import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Maximize2, Minimize2, Star } from 'lucide-react'
import Tabs from '../ui/Tabs'
import type { TabItem } from '../ui/Tabs'
import MetricGrid, { Badge } from '../ui/Metric'
import type { MetricSpec } from '../ui/Metric'
import { progressStore, useProgressStore } from '../../state/progressStore'
import { useSettings } from '../../state/settingsStore'
import useStudyTimer from '../../hooks/useStudyTimer'

/**
 * The frame every rewritten simulation sits in.
 *
 * `SimulationShell` — still used by the pages not yet rewritten — is a fixed
 * two-column grid: stage on the left, one undifferentiated scroll of sliders on
 * the right, and a strip of unlabelled numbers underneath. There is nowhere to put
 * the theory, the worked substitution, the data table or the tutor, which is why
 * none of those existed. This layout gives the stage the width it needs and puts
 * everything else behind tabs in the rail, so depth costs no clarity.
 *
 * It also owns the three things that are the same for every simulation and were
 * previously done nowhere: marking the topic as viewed, banking study time, and
 * offering the favourite and completion toggles the Progress page reads.
 */

export interface LabLayoutProps {
  /** Stable id — the key under which progress, favourites and time are recorded. */
  simulationId: string
  title: string
  /** Small line above the title. Usually the branch of the subject. */
  subtitle?: string
  /** e.g. "Class 11 Physics · Motion in a Plane". Shown as a chip. */
  syllabus?: string
  /** The canvas, normally a `SceneFrame`. */
  stage: ReactNode
  /** Play / reset / speed, directly under the stage. */
  playback?: ReactNode
  /** Live readouts under the stage. */
  metrics?: MetricSpec[]
  /** Full-width content under the metrics: charts, tables. */
  analysis?: ReactNode
  /** The right rail. Conventionally Controls, Theory, Analysis, Practice, Tutor. */
  tabs: TabItem[]
  /** Extra buttons in the header, left of the standard three. */
  toolbar?: ReactNode
  /** Which tab opens first. Defaults to the first. */
  initialTabId?: string
}

export default function LabLayout({
  simulationId,
  title,
  subtitle,
  syllabus,
  stage,
  playback,
  metrics,
  analysis,
  tabs,
  toolbar,
  initialTabId
}: LabLayoutProps) {
  const settings = useSettings()
  const progress = useProgressStore()
  const rootRef = useRef<HTMLElement>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const favorited = progress.favorites.includes(simulationId)
  const completed = progress.completedSimulations.includes(simulationId)

  useEffect(() => {
    progressStore.markViewed(simulationId)
  }, [simulationId])

  useStudyTimer(simulationId)

  // Fullscreen can also be left with Escape or the browser's own control, so the
  // button's label follows the document rather than a click count.
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const node = rootRef.current
    if (!node) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void node.requestFullscreen?.().catch(() => setFullscreen(false))
  }, [])

  return (
    <section className="lab glass" ref={rootRef} aria-label={`${title} simulation`}>
      <header className="lab__header">
        <div className="lab__identity">
          {subtitle ? <p className="eyebrow">{subtitle}</p> : null}
          <h1 className="page-title">{title}</h1>
          {syllabus ? (
            <p className="lab__syllabus">
              <Badge tone="cyan" outline>
                {syllabus}
              </Badge>
            </p>
          ) : null}
        </div>

        <div className="lab__actions toolbar">
          {toolbar}

          <button
            type="button"
            className={completed ? 'button button--ghost is-on' : 'button button--ghost'}
            onClick={() => progressStore.markSimulationComplete(simulationId)}
            aria-pressed={completed}
            title={completed ? 'Marked as understood' : 'Mark this topic as understood'}
          >
            <Check size={15} aria-hidden />
            {completed ? 'Understood' : 'Mark understood'}
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() => progressStore.toggleFavorite(simulationId)}
            aria-pressed={favorited}
            aria-label={favorited ? 'Remove from favourites' : 'Add to favourites'}
            title={favorited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Star size={18} aria-hidden fill={favorited ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen simulation'}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
          </button>
        </div>
      </header>

      <div className="lab__body">
        <div className="lab__main">
          <div className="lab__stage">{stage}</div>
          {playback ? <div className="lab__playback">{playback}</div> : null}
          {metrics && metrics.length > 0 ? (
            <MetricGrid metrics={metrics} sigFigs={settings.sigFigs} className="lab__metrics" />
          ) : null}
          {analysis ? <div className="lab__analysis">{analysis}</div> : null}
        </div>

        <aside className="lab__rail">
          {/* `keepMounted` so switching to Theory and back does not reset a scrolled
              data table or a half-answered question. */}
          <Tabs items={tabs} label="Simulation panels" initialId={initialTabId} keepMounted />
        </aside>
      </div>
    </section>
  )
}
