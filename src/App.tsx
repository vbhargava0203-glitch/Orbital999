import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { StoreProvider, useStore } from './state/store'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { EventTimeline } from './components/EventTimeline'
import { IncidentDetail } from './components/IncidentDetail'
import { CommandPalette } from './components/CommandPalette'
import { OverviewPage } from './components/OverviewPage'
import { MapView } from './components/MapView'
import { IncidentsPage } from './components/IncidentsPage'
import { ResourcesPage } from './components/ResourcesPage'
import { InfrastructurePage } from './components/InfrastructurePage'
import { AlertsPage } from './components/AlertsPage'
import { AnalyticsPage } from './components/AnalyticsPage'
import { SimulationPage } from './components/SimulationPage'
import { ReportsPage } from './components/ReportsPage'
import { SettingsPage } from './components/SettingsPage'

function PageContent() {
  const { state } = useStore()
  switch (state.page) {
    case 'overview': return <ScrollPage><OverviewPage /></ScrollPage>
    case 'map': return <MapView />
    case 'incidents': return <ScrollPage><IncidentsPage /></ScrollPage>
    case 'resources': return <ScrollPage><ResourcesPage /></ScrollPage>
    case 'infrastructure': return <ScrollPage><InfrastructurePage /></ScrollPage>
    case 'alerts': return <ScrollPage><AlertsPage /></ScrollPage>
    case 'analytics': return <ScrollPage><AnalyticsPage /></ScrollPage>
    case 'simulation': return <ScrollPage><SimulationPage /></ScrollPage>
    case 'reports': return <ScrollPage><ReportsPage /></ScrollPage>
    case 'settings': return <ScrollPage><SettingsPage /></ScrollPage>
    default: return null
  }
}

function ScrollPage({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-y-auto">{children}</div>
}

function Toast() {
  const { state } = useStore()
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {state.toast && (
          <motion.div
            key={state.toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass rounded-md px-4 py-2.5 flex items-center gap-2 text-[13px] text-ink shadow-lg"
          >
            <CheckCircle2 size={15} className="text-signal" />
            {state.toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Shell() {
  const { state, dispatch } = useStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const isMapPage = state.page === 'map'

  return (
    <div className="h-screen w-screen flex bg-void text-ink overflow-hidden">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <div className="flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 flex flex-col">
            <PageContent />
            {!isMapPage && <EventTimeline />}
          </div>
        </div>
        {isMapPage && <EventTimeline />}
      </div>
      <IncidentDetail />
      <CommandPalette />
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
