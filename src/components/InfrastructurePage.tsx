import { useStore } from '../state/store'
import { healthColor, healthLabel, typeLabel } from '../lib/utils'

export function InfrastructurePage() {
  const { state } = useStore()
  const sorted = [...state.infrastructure].sort((a, b) => a.health - b.health)

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg text-ink font-medium mb-1">Infrastructure</h1>
      <p className="text-ink-dim text-[13px] mb-4">Health status of monitored power, water, transport, and communication assets.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map(a => (
          <div key={a.id} className="glass rounded-md p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-ink text-[13px]">{a.name}</div>
                <div className="text-ink-faint text-[11px] font-mono uppercase">{typeLabel(a.type)}</div>
              </div>
              <span
                className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded"
                style={{ color: healthColor(a.health), background: `${healthColor(a.health)}1a` }}
              >
                {healthLabel(a.health)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${a.health}%`, background: healthColor(a.health) }} />
            </div>
            <div className="text-right text-ink-faint text-[11px] font-mono mt-1">{a.health}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
