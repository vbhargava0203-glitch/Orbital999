import { Play, Pause, Square, Zap, Radio } from 'lucide-react'
import { useStore } from '../state/store'
import type { SimulationScenario } from '../types'

const SCENARIOS: { key: SimulationScenario; label: string; blurb: string }[] = [
  { key: 'CYCLONE', label: 'Cyclone', blurb: 'Coastal storm system with high winds and flooding' },
  { key: 'FLOOD', label: 'Flood', blurb: 'River overflow and flash flooding across low zones' },
  { key: 'EARTHQUAKE', label: 'Earthquake', blurb: 'Seismic event with structural damage and aftershocks' },
  { key: 'CITY_FIRE', label: 'City fire', blurb: 'Fast-spreading urban fire across dense districts' },
  { key: 'POWER_GRID_FAILURE', label: 'Power grid failure', blurb: 'Cascading substation failures and outages' },
  { key: 'MULTI_INCIDENT_CRISIS', label: 'Multi-incident crisis', blurb: 'Simultaneous incidents straining every resource' },
]

export function SimulationPage() {
  const { state, dispatch } = useStore()
  const sim = state.simulation

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-lg text-ink font-medium mb-1">Simulation</h1>
      <p className="text-ink-dim text-[13px] mb-5">Launch a scenario to generate a realistic sequence of incidents, alerts, and resource activity.</p>

      {sim.active && (
        <div className="glass rounded-md p-4 mb-5 border-l-2 border-severity-critical">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={14} className="text-severity-critical animate-blink" />
            <span className="font-mono text-[12px] uppercase tracking-wide text-severity-critical">Simulation active</span>
            <span className="text-ink-dim text-[12px] ml-2">{sim.scenario?.replace(/_/g, ' ')}</span>
            <span className="ml-auto text-ink-faint text-[11px] font-mono">tick {sim.ticks}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sim.paused ? (
              <IconBtn icon={Play} label="Resume" onClick={() => dispatch({ type: 'RESUME_SIMULATION' })} />
            ) : (
              <IconBtn icon={Pause} label="Pause" onClick={() => dispatch({ type: 'PAUSE_SIMULATION' })} />
            )}
            <IconBtn icon={Square} label="Stop" onClick={() => dispatch({ type: 'STOP_SIMULATION' })} />
            <span className="w-px h-6 bg-line mx-1" />
            {[1, 2, 5].map(sp => (
              <button
                key={sp}
                onClick={() => dispatch({ type: 'SET_SIM_SPEED', speed: sp as 1 | 2 | 5 })}
                className={`focus-ring flex items-center gap-1 text-[12px] font-mono px-2.5 py-1.5 rounded border
                  ${sim.speed === sp ? 'border-signal text-signal bg-signal/10' : 'border-line text-ink-dim'}`}
              >
                <Zap size={12} /> ×{sp}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            onClick={() => dispatch({ type: 'START_SIMULATION', scenario: s.key })}
            disabled={sim.active}
            className="focus-ring glass rounded-md p-4 text-left hover:border-white/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <div className="text-ink text-[14px] mb-1">{s.label}</div>
            <div className="text-ink-faint text-[12px] leading-snug">{s.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function IconBtn({ icon: Icon, label, onClick }: { icon: typeof Play; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="focus-ring flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded border border-line text-ink-dim hover:text-ink hover:border-white/20">
      <Icon size={13} /> {label}
    </button>
  )
}
