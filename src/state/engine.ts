import { nextId } from '../data/demoData'
import { ZONES } from '../data/demoData'
import type {
  Incident, EmergencyResource, InfrastructureAsset, AlertItem,
  TimelineEvent, IncidentType, SimulationScenario,
} from '../types'

let s = 7919
function r() {
  s = (s * 48271) % 2147483647
  return (s - 1) / 2147483646
}
export function chance(p: number) {
  return r() < p
}
export function pickFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)]
}

const STATUS_ORDER: Incident['status'][] = ['DETECTED', 'ASSESSING', 'RESPONDING', 'CONTAINED', 'RESOLVED']

export function advanceIncidentStatus(status: Incident['status']): Incident['status'] {
  const idx = STATUS_ORDER.indexOf(status)
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return status
  return STATUS_ORDER[idx + 1]
}

export function driftInfraHealth(health: number, stress = 1): number {
  const delta = (r() - 0.56) * 4 * stress
  return Math.max(4, Math.min(100, Math.round(health + delta)))
}

export function moveToward(
  lat: number, lng: number, tLat: number, tLng: number, stepFrac: number,
): { lat: number; lng: number; arrived: boolean } {
  const dLat = tLat - lat
  const dLng = tLng - lng
  const dist = Math.sqrt(dLat * dLat + dLng * dLng)
  if (dist < 0.0015) return { lat: tLat, lng: tLng, arrived: true }
  return { lat: lat + dLat * stepFrac, lng: lng + dLng * stepFrac, arrived: false }
}

const SCENARIO_TYPE_MAP: Record<SimulationScenario, IncidentType[]> = {
  CYCLONE: ['CYCLONE', 'FLOOD', 'POWER_FAILURE'],
  FLOOD: ['FLOOD', 'ROAD_ACCIDENT', 'POWER_FAILURE'],
  EARTHQUAKE: ['EARTHQUAKE', 'LANDSLIDE', 'MEDICAL_EMERGENCY'],
  CITY_FIRE: ['FIRE', 'MEDICAL_EMERGENCY', 'ROAD_ACCIDENT'],
  POWER_GRID_FAILURE: ['POWER_FAILURE', 'NETWORK_OUTAGE', 'INDUSTRIAL_ACCIDENT'],
  MULTI_INCIDENT_CRISIS: ['FIRE', 'FLOOD', 'EARTHQUAKE', 'INDUSTRIAL_ACCIDENT', 'POWER_FAILURE', 'ROAD_ACCIDENT'],
}

const SCENARIO_DESC: Record<IncidentType, string> = {
  FIRE: 'Fire spreading rapidly under simulated scenario conditions',
  FLOOD: 'Water levels rising under simulated storm surge',
  CYCLONE: 'Cyclone eyewall passing over the district',
  EARTHQUAKE: 'Aftershock triggering secondary structural damage',
  LANDSLIDE: 'Slope failure following saturated ground conditions',
  INDUSTRIAL_ACCIDENT: 'Facility fault reported during cascading failure',
  POWER_FAILURE: 'Grid segment tripped offline',
  NETWORK_OUTAGE: 'Backbone link lost during the event',
  ROAD_ACCIDENT: 'Collision reported amid evacuation traffic',
  MEDICAL_EMERGENCY: 'Surge in emergency medical calls',
}

export function spawnScenarioIncident(scenario: SimulationScenario): Incident {
  const type = pickFrom(SCENARIO_TYPE_MAP[scenario])
  const zone = pickFrom(ZONES)
  const now = Date.now()
  const severity = pickFrom(['HIGH', 'HIGH', 'CRITICAL'] as const)
  return {
    id: nextId('ORB'),
    type,
    severity,
    status: 'DETECTED',
    lat: zone.lat + (r() - 0.5) * 0.06,
    lng: zone.lng + (r() - 0.5) * 0.06,
    detectedAt: now,
    updatedAt: now,
    description: SCENARIO_DESC[type],
    affectedPopulation: Math.floor(200 + r() * 6000),
    radiusKm: Number((1 + r() * 5).toFixed(1)),
    responseUnitIds: [],
    estResolutionMinutes: Math.floor(30 + r() * 300),
    zoneId: zone.id,
  }
}

export function makeAlert(level: AlertItem['level'], message: string, relatedIncidentId?: string): AlertItem {
  return {
    id: nextId('ALT'),
    level,
    message,
    timestamp: Date.now(),
    relatedIncidentId,
    read: false,
  }
}

export function makeTimelineEvent(text: string, incidentId?: string): TimelineEvent {
  return { id: nextId('EVT'), timestamp: Date.now(), text, incidentId }
}
