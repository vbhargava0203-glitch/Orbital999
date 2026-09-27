import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { resourceStatusColor, typeLabel } from '../lib/utils'
import type { ResourceStatus, ResourceType } from '../types'

const STATUSES: (ResourceStatus | 'ALL')[] = ['ALL', 'AVAILABLE', 'DEPLOYED', 'EN_ROUTE', 'OFFLINE', 'MAINTENANCE']

export function ResourcesPage() {
  const { state, dispatch } = useStore()
  const [status, setStatus] = useState<ResourceStatus | 'ALL'>('ALL')

  const grouped = useMemo(() => {
    const filtered = state.resources.filter(r => status === 'ALL' || r.status === status)
    const byType = new Map<ResourceType, typeof filtered>()
    filtered.forEach(r => {
      const list = byType.get(r.type) ?? []
      list.push(r)
      byType.set(r.type, list)
    })
    return Array.from(byType.entries())
  }, [state.resources, status])

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg text-ink font-medium mb-1">Resources</h1>
      <p className="text-ink-dim text-[13px] mb-4">Fleet and team status across ambulances, fire units, police, air, and shelters.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`focus-ring text-[11px] font-mono uppercase px-2.5 py-1 rounded border
              ${status === s ? 'border-signal text-signal bg-signal/10' : 'border-line text-ink-dim'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {grouped.map(([type, list]) => (
          <div key={type}>
            <div className="text-ink-dim text-[12px] font-mono uppercase mb-2">{typeLabel(type)} <span className="text-ink-faint">({list.length})</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map(r => (
                <div key={r.id} className="glass rounded-md px-3 py-2.5 text-[12px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-ink">{r.id}</span>
                    <span className="flex items-center gap-1.5" style={{ color: resourceStatusColor(r.status) }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: resourceStatusColor(r.status) }} />
                      <span className="font-mono text-[10.5px] uppercase">{typeLabel(r.status)}</span>
                    </span>
                  </div>
                  <div className="text-ink-faint text-[11px] flex items-center justify-between">
                    <span>Team {r.team}</span>
                    <span>Fuel {r.fuel}%</span>
                  </div>
                  {r.assignedIncidentId && (
                    <button
                      className="focus-ring mt-1.5 text-[11px] text-ink-dim hover:text-signal"
                      onClick={() => dispatch({ type: 'SELECT_INCIDENT', id: r.assignedIncidentId! })}
                    >
                      → {r.assignedIncidentId}{r.etaMinutes != null ? ` · ETA ${r.etaMinutes}m` : ''}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && <div className="text-ink-faint text-[13px]">No resources match this filter.</div>}
      </div>
    </div>
  )
}
