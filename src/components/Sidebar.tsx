import {
  Activity, Map as MapIcon, AlertTriangle, Truck, Building2,
  Bell, BarChart3, Radar, FileText, Settings, Orbit,
} from 'lucide-react'
import { useStore } from '../state/store'
import type { Page } from '../types'

const NAV: { key: Page; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'map', label: 'Live Map', icon: MapIcon },
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { key: 'resources', label: 'Resources', icon: Truck },
  { key: 'infrastructure', label: 'Infrastructure', icon: Building2 },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'simulation', label: 'Simulation', icon: Radar },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const unreadAlerts = state.alerts.filter(a => !a.read).length

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <nav
        aria-label="Primary"
        className={`fixed md:static z-40 top-0 left-0 h-full w-60 md:w-56 glass border-r border-line flex flex-col
          transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-line shrink-0">
          <Orbit className="text-signal" size={20} strokeWidth={1.6} />
          <span className="font-semibold tracking-wide text-ink text-[15px]">ORBITAL</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = state.page === key
            return (
              <button
                key={key}
                onClick={() => { dispatch({ type: 'SET_PAGE', page: key }); onClose() }}
                className={`focus-ring w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative
                  ${active ? 'text-ink bg-white/[0.05]' : 'text-ink-dim hover:text-ink hover:bg-white/[0.03]'}`}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-signal rounded-full" />}
                <Icon size={16} strokeWidth={1.6} />
                <span>{label}</span>
                {key === 'alerts' && unreadAlerts > 0 && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-severity-critical/20 text-severity-critical">
                    {unreadAlerts}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="px-4 py-3 border-t border-line text-[11px] text-ink-faint font-mono shrink-0">
          v1.0.0 · demo environment
        </div>
      </nav>
    </>
  )
}
