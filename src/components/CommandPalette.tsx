import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PlusCircle, Search, Truck, Map as MapIcon, BarChart3, Radar,
  FileText, Satellite, Flame, Bell, Command,
} from 'lucide-react'
import { useStore } from '../state/store'
import { spawnScenarioIncident } from '../state/engine'

interface Cmd {
  id: string
  label: string
  icon: typeof PlusCircle
  run: () => void
}

export function CommandPalette() {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (state.commandPaletteOpen) {
      setQuery('')
      window.setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [state.commandPaletteOpen])

  const close = () => dispatch({ type: 'TOGGLE_COMMAND_PALETTE', open: false })

  const commands: Cmd[] = useMemo(() => [
    { id: 'create-incident', label: 'Create incident', icon: PlusCircle, run: () => dispatch({ type: 'CREATE_INCIDENT', incident: spawnScenarioIncident('MULTI_INCIDENT_CRISIS') }) },
    { id: 'search-incident', label: 'Search incident', icon: Search, run: () => dispatch({ type: 'SET_PAGE', page: 'incidents' }) },
    { id: 'dispatch-resource', label: 'Dispatch resource', icon: Truck, run: () => dispatch({ type: 'SET_PAGE', page: 'resources' }) },
    { id: 'open-map', label: 'Open map', icon: MapIcon, run: () => dispatch({ type: 'SET_PAGE', page: 'map' }) },
    { id: 'open-analytics', label: 'Open analytics', icon: BarChart3, run: () => dispatch({ type: 'SET_PAGE', page: 'analytics' }) },
    { id: 'start-simulation', label: 'Start simulation', icon: Radar, run: () => dispatch({ type: 'SET_PAGE', page: 'simulation' }) },
    { id: 'generate-report', label: 'Generate report', icon: FileText, run: () => dispatch({ type: 'SET_PAGE', page: 'reports' }) },
    { id: 'toggle-satellite', label: 'Toggle satellite view', icon: Satellite, run: () => { dispatch({ type: 'SET_PAGE', page: 'map' }); dispatch({ type: 'SET_BASE_STYLE', style: state.baseStyle === 'satellite' ? 'dark' : 'satellite' }) } },
    { id: 'toggle-heatmap', label: 'Toggle heatmap', icon: Flame, run: () => { dispatch({ type: 'SET_PAGE', page: 'map' }); dispatch({ type: 'TOGGLE_LAYER', key: 'heatmap' }) } },
    { id: 'view-alerts', label: 'View alerts', icon: Bell, run: () => dispatch({ type: 'SET_PAGE', page: 'alerts' }) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [state.baseStyle])

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  if (!state.commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 md:pt-32 bg-black/60" onClick={close}>
      <div
        className="glass rounded-lg w-[90vw] max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 px-3 h-12 border-b border-line">
          <Command size={15} className="text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') close()
              if (e.key === 'Enter' && filtered[0]) { filtered[0].run(); close() }
            }}
            placeholder="Type a command…"
            aria-label="Command search"
            className="flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-faint"
          />
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => { c.run(); close() }}
              className="focus-ring w-full flex items-center gap-3 px-3 py-2 text-[13px] text-ink-dim hover:bg-white/[0.06] hover:text-ink"
            >
              <c.icon size={15} />
              {c.label}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-4 text-ink-faint text-[12px]">No matching commands.</div>}
        </div>
      </div>
    </div>
  )
}
