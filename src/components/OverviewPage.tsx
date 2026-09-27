import { Radio, ArrowRight } from 'lucide-react'
import { useStore } from '../state/store'
import { formatNumber, severityColor, alertLevelColor, formatRelative, typeLabel } from '../lib/utils'

export function OverviewPage() {
  const { state, dispatch } = useStore()
  const activeIncidents = state.incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CONTAINED')
  const deployedUnits = state.resources.filter(r => r.status === 'DEPLOYED' || r.status === 'EN_ROUTE').length
  const avgHealth = Math.round(state.infrastructure.reduce((s, a) => s + a.health, 0) / (state.infrastructure.length || 1))
  const peopleAtRisk = activeIncidents.reduce((s, i) => s + i.affectedPopulation, 0)
  const critical = [...state.incidents].filter(i => i.severity === 'CRITICAL').sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6)
  const recentAlerts = [...state.alerts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Radio size={14} className="text-signal animate-blink" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-signal">System status: online</span>
        </div>
        <h1 className="text-xl text-ink font-medium">Global Response Network</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Active incidents" value={activeIncidents.length} />
        <KPI label="Active response units" value={deployedUnits} />
        <KPI label="Infrastructure health" value={`${avgHealth}%`} />
        <KPI label="People at risk" value={formatNumber(peopleAtRisk)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-ink-dim text-[12px] font-mono uppercase">Critical incidents</span>
            <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'incidents' })} className="focus-ring text-ink-faint hover:text-signal text-[11px] flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {critical.map(i => (
              <button
                key={i.id}
                onClick={() => dispatch({ type: 'SELECT_INCIDENT', id: i.id })}
                className="focus-ring w-full flex items-center gap-3 text-left px-2.5 py-2 rounded hover:bg-white/[0.04]"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: severityColor(i.severity) }} />
                <span className="flex-1 min-w-0">
                  <span className="text-ink text-[13px] block">{typeLabel(i.type)} · {i.id}</span>
                  <span className="text-ink-faint text-[11px] block truncate">{i.description}</span>
                </span>
                <span className="text-ink-faint text-[11px] font-mono shrink-0">{formatRelative(i.updatedAt)}</span>
              </button>
            ))}
            {critical.length === 0 && <div className="text-ink-faint text-[12px] px-2.5 py-2">No critical incidents right now.</div>}
          </div>
        </div>

        <div className="glass rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-ink-dim text-[12px] font-mono uppercase">Recent alerts</span>
            <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'alerts' })} className="focus-ring text-ink-faint hover:text-signal text-[11px] flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {recentAlerts.map(a => (
              <div key={a.id} className="flex items-start gap-2.5 px-2.5 py-2">
                <span
                  className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: alertLevelColor(a.level), background: `${alertLevelColor(a.level)}1a` }}
                >
                  {a.level}
                </span>
                <span className="flex-1 text-ink-dim text-[12.5px] leading-snug">{a.message}</span>
                <span className="text-ink-faint text-[11px] font-mono shrink-0">{formatRelative(a.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-md px-4 py-3">
      <div className="text-ink-faint text-[11px] font-mono uppercase mb-1.5">{label}</div>
      <div className="text-ink text-2xl font-mono">{value}</div>
    </div>
  )
}
