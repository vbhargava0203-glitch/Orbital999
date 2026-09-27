import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { useStore } from '../state/store'
import { formatNumber, statusLabel, typeLabel } from '../lib/utils'
import type { Severity } from '../types'

type Period = '24H' | '7D' | '30D' | 'ALL'

export function ReportsPage() {
  const { state } = useStore()
  const [period, setPeriod] = useState<Period>('7D')
  const [region, setRegion] = useState<string>('ALL')
  const [severity, setSeverity] = useState<Severity | 'ALL'>('ALL')

  const periodMs: Record<Period, number> = { '24H': 86_400_000, '7D': 604_800_000, '30D': 2_592_000_000, ALL: Infinity }

  const filtered = useMemo(() => {
    const cutoff = Date.now() - periodMs[period]
    return state.incidents
      .filter(i => i.detectedAt >= cutoff)
      .filter(i => region === 'ALL' || i.zoneId === region)
      .filter(i => severity === 'ALL' || i.severity === severity)
  }, [state.incidents, period, region, severity])

  const resolved = filtered.filter(i => i.status === 'RESOLVED' || i.status === 'CONTAINED').length
  const totalPop = filtered.reduce((s, i) => s + i.affectedPopulation, 0)
  const avgResolution = Math.round(filtered.reduce((s, i) => s + i.estResolutionMinutes, 0) / (filtered.length || 1))
  const deployedUnits = new Set(filtered.flatMap(i => i.responseUnitIds)).size
  const avgInfraHealth = Math.round(state.infrastructure.reduce((s, a) => s + a.health, 0) / (state.infrastructure.length || 1))

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg text-ink font-medium">Reports</h1>
        <button
          onClick={() => window.print()}
          className="focus-ring flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded border border-line text-ink-dim hover:text-ink hover:border-white/20"
        >
          <Printer size={13} /> Export PDF
        </button>
      </div>
      <p className="text-ink-dim text-[13px] mb-5">Generate an incident report for a selected time period, region, and severity.</p>

      <div className="flex flex-wrap gap-3 mb-5 print:hidden">
        <Select label="Period" value={period} onChange={v => setPeriod(v as Period)} options={['24H', '7D', '30D', 'ALL']} />
        <Select label="Region" value={region} onChange={setRegion} options={['ALL', ...state.zones.map(z => z.id)]} display={v => v === 'ALL' ? 'All zones' : state.zones.find(z => z.id === v)?.name ?? v} />
        <Select label="Severity" value={severity} onChange={v => setSeverity(v as Severity | 'ALL')} options={['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']} />
      </div>

      <div id="print-report" className="glass rounded-md p-5 space-y-5">
        <div>
          <div className="text-ink-faint text-[11px] font-mono uppercase mb-1">Executive summary</div>
          <p className="text-ink text-[13px] leading-relaxed">
            Over the selected period, ORBITAL recorded {filtered.length} incidents
            {region !== 'ALL' ? ` in ${state.zones.find(z => z.id === region)?.name}` : ' across all monitored zones'}.
            {resolved} of these reached contained or resolved status, with an average estimated resolution
            time of {avgResolution} minutes. An estimated {formatNumber(totalPop)} people were affected in total.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Incidents" value={filtered.length} />
          <Metric label="Resolved" value={resolved} />
          <Metric label="Units involved" value={deployedUnits} />
          <Metric label="Avg. infra health" value={`${avgInfraHealth}%`} />
        </div>

        <div>
          <div className="text-ink-faint text-[11px] font-mono uppercase mb-2">Incident statistics</div>
          <div className="border border-line rounded-md overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_100px_120px] gap-2 px-3 py-1.5 text-[10.5px] text-ink-faint font-mono border-b border-line bg-white/[0.02]">
              <span>ID</span><span>Type</span><span>Severity</span><span>Status</span>
            </div>
            {filtered.slice(0, 25).map(i => (
              <div key={i.id} className="grid grid-cols-[80px_1fr_100px_120px] gap-2 px-3 py-1.5 text-[12px] border-b border-line last:border-0">
                <span className="font-mono text-ink">{i.id}</span>
                <span className="text-ink-dim">{typeLabel(i.type)}</span>
                <span className="text-ink-dim">{i.severity}</span>
                <span className="text-ink-dim">{statusLabel(i.status)}</span>
              </div>
            ))}
            {filtered.length === 0 && <div className="p-4 text-center text-ink-faint text-[12px]">No incidents in this selection.</div>}
          </div>
        </div>

        <div>
          <div className="text-ink-faint text-[11px] font-mono uppercase mb-1">Resolution status</div>
          <p className="text-ink-dim text-[13px]">
            {resolved} of {filtered.length} incidents in this selection are contained or resolved.
            Remaining incidents are being actively assessed or responded to by dispatched units.
          </p>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-line rounded-md px-3 py-2">
      <div className="text-ink-faint text-[10px] font-mono uppercase mb-1">{label}</div>
      <div className="text-ink text-[16px] font-mono">{value}</div>
    </div>
  )
}

function Select({ label, value, onChange, options, display }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; display?: (v: string) => string
}) {
  return (
    <label className="text-[12px] text-ink-dim flex items-center gap-2">
      {label}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="focus-ring bg-white/[0.04] border border-line rounded px-2 py-1 text-ink text-[12px]"
      >
        {options.map(o => <option key={o} value={o}>{display ? display(o) : o}</option>)}
      </select>
    </label>
  )
}
