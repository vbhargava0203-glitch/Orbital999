import { AnimatePresence, motion } from 'framer-motion'
import { X, Radio, ShieldAlert, ArrowUpCircle, History } from 'lucide-react'
import { useStore } from '../state/store'
import { formatTime, formatRelative, severityColor, statusLabel, typeLabel, formatNumber } from '../lib/utils'

export function IncidentDetail() {
  const { state, dispatch } = useStore()
  const incident = state.incidents.find(i => i.id === state.selectedIncidentId)
  const available = state.resources.filter(r => r.status === 'AVAILABLE')

  return (
    <AnimatePresence>
      {incident && (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
          className="fixed md:static top-0 right-0 h-full w-full sm:w-[380px] glass border-l border-line z-40 flex flex-col"
          role="dialog"
          aria-label={`Incident ${incident.id} details`}
        >
          <div className="flex items-center justify-between px-4 h-14 border-b border-line shrink-0">
            <div>
              <div className="text-[11px] font-mono text-ink-faint">INCIDENT</div>
              <div className="font-mono text-sm text-ink">#{incident.id}</div>
            </div>
            <button
              className="focus-ring p-1.5 text-ink-dim hover:text-ink"
              onClick={() => dispatch({ type: 'SELECT_INCIDENT', id: null })}
              aria-label="Close incident detail"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[13px]">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wide"
                style={{ color: severityColor(incident.severity), background: `${severityColor(incident.severity)}1a`, border: `1px solid ${severityColor(incident.severity)}44` }}
              >
                {incident.severity}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wide border border-line text-ink-dim">
                {statusLabel(incident.status)}
              </span>
            </div>

            <div>
              <div className="text-ink-faint text-[11px] mb-0.5">Type</div>
              <div className="text-ink">{typeLabel(incident.type)}</div>
            </div>

            <div>
              <div className="text-ink-faint text-[11px] mb-0.5">Description</div>
              <div className="text-ink-dim leading-relaxed">{incident.description}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Location" value={`${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)}`} mono />
              <Field label="Detected" value={`${formatTime(incident.detectedAt)} · ${formatRelative(incident.detectedAt)}`} mono />
              <Field label="Affected area" value={`${incident.radiusKm} km radius`} />
              <Field label="Affected population" value={formatNumber(incident.affectedPopulation)} />
              <Field label="Response units" value={String(incident.responseUnitIds.length)} />
              <Field label="Est. resolution" value={`${incident.estResolutionMinutes} min`} />
            </div>

            {incident.responseUnitIds.length > 0 && (
              <div>
                <div className="text-ink-faint text-[11px] mb-1">Assigned units</div>
                <div className="flex flex-wrap gap-1.5">
                  {incident.responseUnitIds.map(id => (
                    <span key={id} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-line text-ink-dim">{id}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-ink-faint text-[11px] mb-1.5 flex items-center gap-1"><Radio size={11} /> Dispatch a unit</div>
              <div className="max-h-32 overflow-y-auto border border-line rounded-md divide-y divide-line">
                {available.length === 0 && <div className="p-2 text-ink-faint text-[12px]">No available units</div>}
                {available.slice(0, 12).map(r => (
                  <button
                    key={r.id}
                    onClick={() => dispatch({ type: 'DISPATCH_UNIT', incidentId: incident.id, resourceId: r.id })}
                    className="focus-ring w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] hover:bg-white/[0.05] text-left"
                  >
                    <span className="font-mono text-ink">{r.id}</span>
                    <span className="text-ink-faint">{typeLabel(r.type)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-line grid grid-cols-3 gap-2 shrink-0">
            <ActionButton
              label="Mark contained"
              icon={ShieldAlert}
              onClick={() => dispatch({ type: 'MARK_CONTAINED', incidentId: incident.id })}
              disabled={incident.status === 'CONTAINED' || incident.status === 'RESOLVED'}
            />
            <ActionButton
              label="Escalate"
              icon={ArrowUpCircle}
              onClick={() => dispatch({ type: 'ESCALATE', incidentId: incident.id })}
              disabled={incident.severity === 'CRITICAL'}
            />
            <ActionButton
              label="View timeline"
              icon={History}
              onClick={() => dispatch({ type: 'SET_PAGE', page: 'overview' })}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-ink-faint text-[11px] mb-0.5">{label}</div>
      <div className={`text-ink ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</div>
    </div>
  )
}

function ActionButton({ label, icon: Icon, onClick, disabled }: { label: string; icon: typeof ShieldAlert; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="focus-ring flex flex-col items-center gap-1 py-2 rounded-md border border-line text-ink-dim text-[10.5px] leading-tight
        hover:text-ink hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none"
    >
      <Icon size={15} />
      <span className="text-center">{label}</span>
    </button>
  )
}
