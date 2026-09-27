import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import type {
  Incident, EmergencyResource, InfrastructureAsset, AlertItem, TimelineEvent,
  Zone, SimulationState, SimulationScenario, MapLayerKey, MapBaseStyle,
  HeatmapMode, Page, ResourceStatus,
} from '../types'
import {
  generateIncidents, generateResources, generateInfrastructure,
  generateAlerts, generateTimeline, ZONES,
} from '../data/demoData'
import {
  advanceIncidentStatus, driftInfraHealth, moveToward, chance, pickFrom,
  spawnScenarioIncident, makeAlert, makeTimelineEvent,
} from './engine'

export interface AppState {
  incidents: Incident[]
  resources: EmergencyResource[]
  infrastructure: InfrastructureAsset[]
  alerts: AlertItem[]
  timeline: TimelineEvent[]
  zones: Zone[]
  selectedIncidentId: string | null
  page: Page
  layers: Record<MapLayerKey, boolean>
  baseStyle: MapBaseStyle
  heatmapMode: HeatmapMode
  simulation: SimulationState
  searchQuery: string
  commandPaletteOpen: boolean
  toast: { id: number; text: string } | null
  systemStartedAt: number
}

type Action =
  | { type: 'SELECT_INCIDENT'; id: string | null }
  | { type: 'SET_PAGE'; page: Page }
  | { type: 'TOGGLE_LAYER'; key: MapLayerKey }
  | { type: 'SET_BASE_STYLE'; style: MapBaseStyle }
  | { type: 'SET_HEATMAP_MODE'; mode: HeatmapMode }
  | { type: 'DISPATCH_UNIT'; incidentId: string; resourceId: string }
  | { type: 'MARK_CONTAINED'; incidentId: string }
  | { type: 'ESCALATE'; incidentId: string }
  | { type: 'ADVANCE_STATUS'; incidentId: string }
  | { type: 'MARK_ALERT_READ'; id: string }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'TOGGLE_COMMAND_PALETTE'; open?: boolean }
  | { type: 'START_SIMULATION'; scenario: SimulationScenario }
  | { type: 'PAUSE_SIMULATION' }
  | { type: 'RESUME_SIMULATION' }
  | { type: 'SET_SIM_SPEED'; speed: 1 | 2 | 5 }
  | { type: 'STOP_SIMULATION' }
  | { type: 'TICK' }
  | { type: 'TOAST'; text: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'CREATE_INCIDENT'; incident: Incident }
  | { type: 'RESET_DEMO' }

function initialState(): AppState {
  const incidents = generateIncidents(22)
  return {
    incidents,
    resources: generateResources(32),
    infrastructure: generateInfrastructure(16),
    alerts: generateAlerts(),
    timeline: generateTimeline(incidents),
    zones: ZONES,
    selectedIncidentId: null,
    page: 'overview',
    layers: { incidents: true, resources: true, infrastructure: true, heatmap: false, zones: false },
    baseStyle: 'dark',
    heatmapMode: 'RISK_LEVEL',
    simulation: { active: false, scenario: null, paused: false, speed: 1, startedAt: null, ticks: 0 },
    searchQuery: '',
    commandPaletteOpen: false,
    toast: null,
    systemStartedAt: Date.now(),
  }
}

let toastCounter = 0

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_INCIDENT':
      return { ...state, selectedIncidentId: action.id, page: action.id ? state.page : state.page }
    case 'SET_PAGE':
      return { ...state, page: action.page }
    case 'TOGGLE_LAYER':
      return { ...state, layers: { ...state.layers, [action.key]: !state.layers[action.key] } }
    case 'SET_BASE_STYLE':
      return { ...state, baseStyle: action.style }
    case 'SET_HEATMAP_MODE':
      return { ...state, heatmapMode: action.mode }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query }
    case 'TOGGLE_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: action.open ?? !state.commandPaletteOpen }
    case 'TOAST':
      toastCounter += 1
      return { ...state, toast: { id: toastCounter, text: action.text } }
    case 'CLEAR_TOAST':
      return { ...state, toast: null }

    case 'DISPATCH_UNIT': {
      const incident = state.incidents.find(i => i.id === action.incidentId)
      const resource = state.resources.find(r => r.id === action.resourceId)
      if (!incident || !resource) return state
      const resources = state.resources.map(r =>
        r.id === action.resourceId
          ? { ...r, status: 'EN_ROUTE' as ResourceStatus, assignedIncidentId: incident.id, etaMinutes: Math.max(2, Math.round(3 + Math.random() * 12)) }
          : r,
      )
      const incidents = state.incidents.map(i =>
        i.id === incident.id
          ? { ...i, responseUnitIds: Array.from(new Set([...i.responseUnitIds, resource.id])), updatedAt: Date.now(), status: i.status === 'DETECTED' ? 'ASSESSING' : i.status }
          : i,
      )
      const timeline = [...state.timeline, makeTimelineEvent(`${resource.id} dispatched to ${incident.id}`, incident.id)]
      toastCounter += 1
      return { ...state, resources, incidents, timeline, toast: { id: toastCounter, text: `${resource.id} dispatched to ${incident.id}` } }
    }

    case 'MARK_CONTAINED': {
      const incidents = state.incidents.map(i =>
        i.id === action.incidentId ? { ...i, status: 'CONTAINED' as const, updatedAt: Date.now() } : i,
      )
      const resources = state.resources.map(r =>
        r.assignedIncidentId === action.incidentId ? { ...r, status: 'AVAILABLE' as ResourceStatus, assignedIncidentId: null, etaMinutes: null } : r,
      )
      const timeline = [...state.timeline, makeTimelineEvent(`Incident ${action.incidentId} marked as contained`, action.incidentId)]
      toastCounter += 1
      return { ...state, incidents, resources, timeline, toast: { id: toastCounter, text: `Incident ${action.incidentId} marked as contained` } }
    }

    case 'ESCALATE': {
      const sevOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
      const incidents = state.incidents.map(i => {
        if (i.id !== action.incidentId) return i
        const idx = sevOrder.indexOf(i.severity)
        const next = sevOrder[Math.min(idx + 1, sevOrder.length - 1)]
        return { ...i, severity: next, updatedAt: Date.now() }
      })
      const timeline = [...state.timeline, makeTimelineEvent(`Incident ${action.incidentId} escalated`, action.incidentId)]
      const alerts = [makeAlert('HIGH', `Incident ${action.incidentId} escalated by operator`, action.incidentId), ...state.alerts]
      toastCounter += 1
      return { ...state, incidents, timeline, alerts, toast: { id: toastCounter, text: `Incident ${action.incidentId} escalated` } }
    }

    case 'ADVANCE_STATUS': {
      const incidents = state.incidents.map(i =>
        i.id === action.incidentId ? { ...i, status: advanceIncidentStatus(i.status), updatedAt: Date.now() } : i,
      )
      return { ...state, incidents }
    }

    case 'MARK_ALERT_READ':
      return { ...state, alerts: state.alerts.map(a => (a.id === action.id ? { ...a, read: true } : a)) }

    case 'CREATE_INCIDENT': {
      const timeline = [...state.timeline, makeTimelineEvent(`Incident ${action.incident.id} detected — ${action.incident.type.replace('_', ' ').toLowerCase()}`, action.incident.id)]
      const alerts = [makeAlert(action.incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH', `New ${action.incident.type.replace('_', ' ').toLowerCase()} detected`, action.incident.id), ...state.alerts]
      return { ...state, incidents: [action.incident, ...state.incidents], timeline, alerts }
    }

    case 'START_SIMULATION':
      return {
        ...state,
        simulation: { active: true, scenario: action.scenario, paused: false, speed: 1, startedAt: Date.now(), ticks: 0 },
        timeline: [...state.timeline, makeTimelineEvent(`Simulation started: ${action.scenario.replace(/_/g, ' ')}`)],
      }
    case 'PAUSE_SIMULATION':
      return { ...state, simulation: { ...state.simulation, paused: true } }
    case 'RESUME_SIMULATION':
      return { ...state, simulation: { ...state.simulation, paused: false } }
    case 'SET_SIM_SPEED':
      return { ...state, simulation: { ...state.simulation, speed: action.speed } }
    case 'STOP_SIMULATION':
      return {
        ...state,
        simulation: { active: false, scenario: null, paused: false, speed: 1, startedAt: null, ticks: 0 },
        timeline: [...state.timeline, makeTimelineEvent('Simulation stopped')],
      }

    case 'TICK': {
      let { incidents, resources, infrastructure, alerts, timeline, simulation } = state
      const stress = simulation.active ? 1.8 : 1

      infrastructure = infrastructure.map(a => ({ ...a, health: driftInfraHealth(a.health, stress) }))

      resources = resources.map(r => {
        if (r.status !== 'EN_ROUTE' || !r.assignedIncidentId) return r
        const incident = incidents.find(i => i.id === r.assignedIncidentId)
        if (!incident) return { ...r, status: 'AVAILABLE' as ResourceStatus, assignedIncidentId: null, etaMinutes: null }
        const moved = moveToward(r.lat, r.lng, incident.lat, incident.lng, 0.35)
        const eta = r.etaMinutes ? Math.max(0, r.etaMinutes - 1) : 0
        if (moved.arrived || eta <= 0) {
          return { ...r, lat: incident.lat, lng: incident.lng, status: 'DEPLOYED' as ResourceStatus, etaMinutes: null }
        }
        return { ...r, lat: moved.lat, lng: moved.lng, etaMinutes: eta }
      })

      if (chance(0.22)) {
        const active = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CONTAINED')
        if (active.length) {
          const target = pickFrom(active)
          incidents = incidents.map(i =>
            i.id === target.id ? { ...i, status: advanceIncidentStatus(i.status), updatedAt: Date.now() } : i,
          )
          timeline = [...timeline, makeTimelineEvent(`Incident ${target.id} status updated to ${advanceIncidentStatus(target.status)}`, target.id)].slice(-120)
        }
      }

      if (chance(simulation.active ? 0.5 : 0.16)) {
        const templates: { level: AlertItem['level']; text: string }[] = [
          { level: 'MEDIUM', text: 'Road congestion increasing near Central Grid' },
          { level: 'LOW', text: 'Weather sensors report shifting wind patterns' },
          { level: 'HIGH', text: 'Power grid instability detected' },
          { level: 'CRITICAL', text: 'Flood level rising near Riverside Flats' },
          { level: 'MEDIUM', text: 'Additional medical unit requested' },
        ]
        const t = pickFrom(templates)
        alerts = [makeAlert(t.level, t.text), ...alerts].slice(0, 60)
      }

      if (simulation.active && !simulation.paused && chance(0.3)) {
        const incident = spawnScenarioIncident(simulation.scenario!)
        incidents = [incident, ...incidents]
        timeline = [...timeline, makeTimelineEvent(`Incident ${incident.id} detected — ${incident.type.replace('_', ' ').toLowerCase()}`, incident.id)].slice(-120)
        alerts = [makeAlert(incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH', `New ${incident.type.replace('_', ' ').toLowerCase()} detected`, incident.id), ...alerts].slice(0, 60)
      }

      const nextSim = simulation.active ? { ...simulation, ticks: simulation.ticks + 1 } : simulation
      return { ...state, incidents, resources, infrastructure, alerts, timeline, simulation: nextSim }
    }

    case 'RESET_DEMO':
      return initialState()

    default:
      return state
  }
}

interface Ctx {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const baseInterval = 4000
    const speedFactor = state.simulation.active ? state.simulation.speed : 1
    const interval = state.simulation.paused ? null : Math.max(600, baseInterval / speedFactor)

    if (intervalRef.current) window.clearInterval(intervalRef.current)
    if (interval) {
      intervalRef.current = window.setInterval(() => dispatch({ type: 'TICK' }), interval)
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [state.simulation.active, state.simulation.speed, state.simulation.paused])

  useEffect(() => {
    if (!state.toast) return
    const t = window.setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3200)
    return () => window.clearTimeout(t)
  }, [state.toast])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
