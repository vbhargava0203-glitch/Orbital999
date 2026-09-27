import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useStore } from '../state/store'
import { alertLevelColor, formatRelative } from '../lib/utils'

export function AlertsPage() {
  const { state, dispatch } = useStore()
  const alerts = [...state.alerts].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-lg text-ink font-medium mb-1">Alerts</h1>
      <p className="text-ink-dim text-[13px] mb-5">Live feed of system-generated warnings across all monitored zones.</p>

      <div className="space-y-2">
        {alerts.map(a => (
          <div
            key={a.id}
            className={`glass rounded-md px-4 py-3 flex items-start gap-3 border-l-2 ${a.read ? 'opacity-60' : ''}`}
            style={{ borderLeftColor: alertLevelColor(a.level) }}
          >
            <AlertTriangle size={16} style={{ color: alertLevelColor(a.level) }} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{ color: alertLevelColor(a.level), background: `${alertLevelColor(a.level)}1a` }}
                >
                  {a.level}
                </span>
                <span className="text-ink-faint text-[11px] font-mono">{formatRelative(a.timestamp)}</span>
              </div>
              <div className="text-ink text-[13px]">{a.message}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {a.relatedIncidentId && (
                <button
                  className="focus-ring text-[11px] text-ink-dim border border-line rounded px-2 py-1 hover:text-ink hover:border-white/20"
                  onClick={() => dispatch({ type: 'SELECT_INCIDENT', id: a.relatedIncidentId! })}
                >
                  View incident
                </button>
              )}
              {!a.read && (
                <button
                  className="focus-ring p-1 text-ink-faint hover:text-signal"
                  onClick={() => dispatch({ type: 'MARK_ALERT_READ', id: a.id })}
                  aria-label="Mark as read"
                >
                  <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {alerts.length === 0 && <div className="text-ink-faint text-[13px]">No alerts.</div>}
      </div>
    </div>
  )
}
