import { useEffect, useState } from 'react'
import { Menu, Search, Command, Radio } from 'lucide-react'
import { useStore } from '../state/store'
import { typeLabel } from '../lib/utils'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { state, dispatch } = useStore()
  const [clock, setClock] = useState(() => new Date())
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const q = state.searchQuery.trim().toLowerCase()
  const results = q.length > 0 ? [
    ...state.incidents.filter(i => i.id.toLowerCase().includes(q) || i.type.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
      .slice(0, 5).map(i => ({ kind: 'Incident', id: i.id, label: `${i.id} — ${typeLabel(i.type)}`, action: () => { dispatch({ type: 'SELECT_INCIDENT', id: i.id }); dispatch({ type: 'SET_PAGE', page: 'incidents' }) } })),
    ...state.resources.filter(r => r.id.toLowerCase().includes(q) || r.type.toLowerCase().includes(q))
      .slice(0, 5).map(r => ({ kind: 'Resource', id: r.id, label: `${r.id} — ${typeLabel(r.type)}`, action: () => dispatch({ type: 'SET_PAGE', page: 'resources' }) })),
    ...state.infrastructure.filter(a => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q))
      .slice(0, 5).map(a => ({ kind: 'Infrastructure', id: a.id, label: a.name, action: () => dispatch({ type: 'SET_PAGE', page: 'infrastructure' }) })),
    ...state.zones.filter(z => z.name.toLowerCase().includes(q))
      .slice(0, 3).map(z => ({ kind: 'Zone', id: z.id, label: z.name, action: () => dispatch({ type: 'SET_PAGE', page: 'map' }) })),
  ] : []

  return (
    <header className="h-14 shrink-0 glass border-b border-line flex items-center gap-3 px-3 md:px-4 relative z-20">
      <button className="focus-ring md:hidden p-1.5 text-ink-dim" onClick={onMenuClick} aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className="hidden md:flex items-center gap-2 text-[12px] font-mono text-ink-dim">
        <Radio size={13} className="text-signal animate-blink" />
        <span className="text-signal">SYSTEM ONLINE</span>
        <span className="text-ink-faint">|</span>
        <span>{clock.toLocaleTimeString(undefined, { hour12: false })}</span>
      </div>

      <div className="relative flex-1 max-w-md ml-auto">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={state.searchQuery}
          onChange={e => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder="Search incidents, resources, locations…"
          aria-label="Global search"
          className="focus-ring w-full bg-white/[0.03] border border-line rounded-md pl-8 pr-3 py-1.5 text-[13px] text-ink placeholder:text-ink-faint outline-none"
        />
        {focused && results.length > 0 && (
          <ul className="absolute top-full mt-1 left-0 right-0 glass rounded-md overflow-hidden shadow-lg">
            {results.map(r => (
              <li key={r.kind + r.id}>
                <button
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-white/[0.06] flex items-center justify-between"
                  onMouseDown={() => { r.action(); dispatch({ type: 'SET_SEARCH', query: '' }) }}
                >
                  <span className="text-ink">{r.label}</span>
                  <span className="text-[10px] font-mono text-ink-faint uppercase">{r.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })}
        className="focus-ring hidden sm:flex items-center gap-1.5 text-[12px] text-ink-dim border border-line rounded-md px-2.5 py-1.5 hover:text-ink hover:border-white/20"
      >
        <Command size={13} />
        <span className="font-mono">K</span>
      </button>
    </header>
  )
}
