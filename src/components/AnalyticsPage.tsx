import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useStore } from '../state/store'
import { formatNumber, severityColor, healthColor } from '../lib/utils'

type Range = '24H' | '7D' | '30D'

const TOOLTIP_STYLE = {
  background: '#12151C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
  fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: '#E7EAEE',
}

export function AnalyticsPage() {
  const { state } = useStore()
  const [range, setRange] = useState<Range>('24H')

  const buckets = range === '24H' ? 24 : range === '7D' ? 7 : 30
  const bucketMs = range === '24H' ? 3600_000 : 86_400_000

  const trend = useMemo(() => {
    const now = Date.now()
    return Array.from({ length: buckets }, (_, idx) => {
      const bucketStart = now - (buckets - idx) * bucketMs
      const bucketEnd = bucketStart + bucketMs
      const created = state.incidents.filter(i => i.detectedAt >= bucketStart && i.detectedAt < bucketEnd).length
      const resolved = state.incidents.filter(i => (i.status === 'RESOLVED' || i.status === 'CONTAINED') && i.updatedAt >= bucketStart && i.updatedAt < bucketEnd).length
      return {
        label: range === '24H' ? new Date(bucketEnd).getHours() + ':00' : new Date(bucketEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        incidents: created,
        resolved,
      }
    })
  }, [state.incidents, buckets, bucketMs, range])

  const severityDist = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    state.incidents.forEach(i => { counts[i.severity] += 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [state.incidents])

  const resourceUtil = useMemo(() => {
    const counts: Record<string, number> = {}
    state.resources.forEach(r => { counts[r.type] = (counts[r.type] ?? 0) + (r.status === 'DEPLOYED' || r.status === 'EN_ROUTE' ? 1 : 0) })
    const totals: Record<string, number> = {}
    state.resources.forEach(r => { totals[r.type] = (totals[r.type] ?? 0) + 1 })
    return Object.keys(totals).map(type => ({
      type: type.replace('_', ' '),
      utilization: Math.round(((counts[type] ?? 0) / totals[type]) * 100),
    }))
  }, [state.resources])

  const activeIncidents = state.incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CONTAINED').length
  const resolvedIncidents = state.incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CONTAINED').length
  const avgHealth = Math.round(state.infrastructure.reduce((s, a) => s + a.health, 0) / (state.infrastructure.length || 1))
  const totalPopulation = state.incidents.reduce((s, i) => s + i.affectedPopulation, 0)
  const deployedResources = state.resources.filter(r => r.status === 'DEPLOYED' || r.status === 'EN_ROUTE').length
  const avgResolution = Math.round(state.incidents.reduce((s, i) => s + i.estResolutionMinutes, 0) / (state.incidents.length || 1))

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h1 className="text-lg text-ink font-medium">Analytics</h1>
        <div className="flex gap-1">
          {(['24H', '7D', '30D'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`focus-ring text-[11px] font-mono px-2.5 py-1 rounded border
                ${range === r ? 'border-signal text-signal bg-signal/10' : 'border-line text-ink-dim'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <p className="text-ink-dim text-[13px] mb-5">Operational statistics across the monitored area.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
        <Stat label="Active incidents" value={activeIncidents} />
        <Stat label="Resolved" value={resolvedIncidents} />
        <Stat label="Avg. response" value={`${avgResolution}m`} />
        <Stat label="Resource use" value={`${deployedResources}/${state.resources.length}`} />
        <Stat label="Infra health" value={`${avgHealth}%`} />
        <Stat label="Affected pop." value={formatNumber(totalPopulation)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-md p-4">
          <div className="text-ink-dim text-[12px] font-mono uppercase mb-3">Incident trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#5B6472" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#5B6472" fontSize={11} tickLine={false} axisLine={false} width={26} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8B94A3' }} />
              <Line type="monotone" dataKey="incidents" name="New" stroke="#F5A524" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#49D3C8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-md p-4">
          <div className="text-ink-dim text-[12px] font-mono uppercase mb-3">Severity distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {severityDist.map(d => <Cell key={d.name} fill={severityColor(d.name as any)} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8B94A3' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-md p-4">
          <div className="text-ink-dim text-[12px] font-mono uppercase mb-3">Resource utilization</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={resourceUtil} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#5B6472" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="type" stroke="#8B94A3" fontSize={10.5} width={90} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="utilization" fill="#49D3C8" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-md p-4">
          <div className="text-ink-dim text-[12px] font-mono uppercase mb-3">Infrastructure health</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={state.infrastructure.map(a => ({ name: a.name.split(' ')[0], health: a.health }))}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#5B6472" fontSize={9.5} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis stroke="#5B6472" fontSize={11} tickLine={false} axisLine={false} width={26} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="health" radius={[3, 3, 0, 0]}>
                {state.infrastructure.map(a => <Cell key={a.id} fill={healthColor(a.health)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-md px-3 py-2.5">
      <div className="text-ink-faint text-[10.5px] font-mono uppercase mb-1 truncate">{label}</div>
      <div className="text-ink text-lg font-medium font-mono">{value}</div>
    </div>
  )
}
