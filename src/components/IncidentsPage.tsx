import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { severityColor, statusLabel, typeLabel, formatRelative, formatNumber } from '../lib/utils'
import type { IncidentStatus, Severity } from '../types'

const STATUSES: (IncidentStatus | 'ALL')[] = ['ALL', 'DETECTED', 'ASSESSING', 'RESPONDING', 'CONTAINED', 'RESOLVED']
const SEVERITIES: (Severity | 'ALL')[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export function IncidentsPage() {
  const { state, dispatch } = useStore()
  const [status, setStatus] = useState<IncidentStatus | 'ALL'>('ALL')
  const [severity, setSeverity] = useState<Severity | 'ALL'>('ALL')

  const incidents = useMemo(() => {
    return [...state.incidents]
      .filter(i => status === 'ALL' || i.status === status)
      .filter(i => severity === 'ALL' || i.severity === severity)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [state.incidents, status, severity])

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg text-ink font-medium">Incidents</h1>
        <span className="text-ink-faint text-[12px] font-mono">{incidents.length} shown</span>
      </div>
      <p className="text-ink-dim text-[13px] mb-4">All detected incidents across the monitored area.</p>

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
        <span className="w-px bg-line mx-1" />
        {SEVERITIES.map(s => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            className={`focus-ring text-[11px] font-mono uppercase px-2.5 py-1 rounded border
              ${severity === s ? 'border-white/30 text-ink' : 'border-line text-ink-dim'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="border border-line rounded-md overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_110px_110px_90px_90px] gap-2 px-3 py-2 text-[11px] text-ink-faint font-mono border-b border-line bg-white/[0.02]">
          <span>ID</span><span>Type / description</span><span>Severity</span><span>Status</span><span>Population</span><span>Updated</span>
        </div>
        <div className="max-h-[65vh] overflow-y-auto divide-y divide-line">
          {incidents.map(i => (
            <button
              key={i.id}
              onClick={() => dispatch({ type: 'SELECT_INCIDENT', id: i.id })}
              className="focus-ring w-full grid grid-cols-[80px_1fr_110px_110px_90px_90px] gap-2 px-3 py-2.5 text-left text-[12px] hover:bg-white/[0.04]"
            >
              <span className="font-mono text-ink">{i.id}</span>
              <span className="min-w-0">
                <span className="text-ink block">{typeLabel(i.type)}</span>
                <span className="text-ink-faint block truncate">{i.description}</span>
              </span>
              <span style={{ color: severityColor(i.severity) }} className="font-mono uppercase text-[11px]">{i.severity}</span>
              <span className="text-ink-dim font-mono text-[11px] uppercase">{statusLabel(i.status)}</span>
              <span className="text-ink-dim font-mono text-[11px]">{formatNumber(i.affectedPopulation)}</span>
              <span className="text-ink-faint font-mono text-[11px]">{formatRelative(i.updatedAt)}</span>
            </button>
          ))}
          {incidents.length === 0 && <div className="p-6 text-center text-ink-faint text-[13px]">No incidents match these filters.</div>}
        </div>
      </div>
    </div>
  )
}
