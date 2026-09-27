export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type IncidentType =
  | 'FIRE' | 'FLOOD' | 'CYCLONE' | 'EARTHQUAKE' | 'LANDSLIDE'
  | 'INDUSTRIAL_ACCIDENT' | 'POWER_FAILURE' | 'NETWORK_OUTAGE'
  | 'ROAD_ACCIDENT' | 'MEDICAL_EMERGENCY'

export type IncidentStatus = 'DETECTED' | 'ASSESSING' | 'RESPONDING' | 'CONTAINED' | 'RESOLVED'

export interface Incident {
  id: string
  type: IncidentType
  severity: Severity
  status: IncidentStatus
  lat: number
  lng: number
  detectedAt: number
  updatedAt: number
  description: string
  affectedPopulation: number
  radiusKm: number
  responseUnitIds: string[]
  estResolutionMinutes: number
  zoneId: string
}

export type ResourceType =
  | 'AMBULANCE' | 'FIRE_TRUCK' | 'POLICE' | 'HELICOPTER'
  | 'RESCUE_TEAM' | 'MEDICAL_TEAM' | 'SHELTER'

export type ResourceStatus = 'AVAILABLE' | 'DEPLOYED' | 'EN_ROUTE' | 'OFFLINE' | 'MAINTENANCE'

export interface EmergencyResource {
  id: string
  type: ResourceType
  lat: number
  lng: number
  homeLat: number
  homeLng: number
  status: ResourceStatus
  assignedIncidentId: string | null
  fuel: number
  team: string
  etaMinutes: number | null
}

export type InfrastructureType =
  | 'POWER_GRID' | 'WATER' | 'HOSPITAL' | 'BRIDGE'
  | 'ROAD' | 'COMM_TOWER' | 'INDUSTRIAL' | 'AIRPORT'

export interface InfrastructureAsset {
  id: string
  type: InfrastructureType
  name: string
  lat: number
  lng: number
  health: number
}

export type AlertLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AlertItem {
  id: string
  level: AlertLevel
  message: string
  timestamp: number
  relatedIncidentId?: string
  read: boolean
}

export interface TimelineEvent {
  id: string
  timestamp: number
  text: string
  incidentId?: string
}

export interface Zone {
  id: string
  name: string
  lat: number
  lng: number
  riskLevel: Severity
  population: number
}

export type SimulationScenario =
  | 'CYCLONE' | 'FLOOD' | 'EARTHQUAKE' | 'CITY_FIRE'
  | 'POWER_GRID_FAILURE' | 'MULTI_INCIDENT_CRISIS'

export interface SimulationState {
  active: boolean
  scenario: SimulationScenario | null
  paused: boolean
  speed: 1 | 2 | 5
  startedAt: number | null
  ticks: number
}

export type MapLayerKey =
  | 'incidents' | 'resources' | 'infrastructure' | 'heatmap' | 'zones'

export type MapBaseStyle = 'dark' | 'light' | 'satellite'

export type HeatmapMode = 'INCIDENT_DENSITY' | 'RISK_LEVEL' | 'POPULATION_IMPACT' | 'INFRASTRUCTURE_RISK'

export type Page =
  | 'overview' | 'map' | 'incidents' | 'resources' | 'infrastructure'
  | 'alerts' | 'analytics' | 'simulation' | 'reports' | 'settings'
