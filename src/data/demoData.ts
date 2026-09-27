import type {
  Incident, IncidentType, EmergencyResource, ResourceType,
  InfrastructureAsset, InfrastructureType, AlertItem, Zone,
  TimelineEvent, Severity,
} from '../types'

// Fictional metro area "Meridian" used purely for this simulated demo.
export const CITY_CENTER = { lat: 40.735, lng: -73.955 }

let seed = 42
function rand() {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
function randRange(min: number, max: number) {
  return min + rand() * (max - min)
}
function jitter(center: number, spread: number) {
  return center + (rand() - 0.5) * spread
}
let counter = 1000
export function nextId(prefix: string) {
  counter += 1
  return `${prefix}-${counter}`
}

export const ZONES: Zone[] = [
  { id: 'zone-01', name: 'Harbor District', lat: jitter(CITY_CENTER.lat, 0.14), lng: jitter(CITY_CENTER.lng, 0.14), riskLevel: 'HIGH', population: 84210 },
  { id: 'zone-02', name: 'Highland Ridge', lat: jitter(CITY_CENTER.lat, 0.14), lng: jitter(CITY_CENTER.lng, 0.14), riskLevel: 'MEDIUM', population: 51340 },
  { id: 'zone-03', name: 'Central Grid', lat: jitter(CITY_CENTER.lat, 0.14), lng: jitter(CITY_CENTER.lng, 0.14), riskLevel: 'CRITICAL', population: 132870 },
  { id: 'zone-04', name: 'Riverside Flats', lat: jitter(CITY_CENTER.lat, 0.14), lng: jitter(CITY_CENTER.lng, 0.14), riskLevel: 'HIGH', population: 67200 },
  { id: 'zone-05', name: 'Industrial Belt', lat: jitter(CITY_CENTER.lat, 0.14), lng: jitter(CITY_CENTER.lng, 0.14), riskLevel: 'MEDIUM', population: 22190 },
  { id: 'zone-06', name: 'Eastgate', lat: jitter(CITY_CENTER.lat, 0.14), lng: jitter(CITY_CENTER.lng, 0.14), riskLevel: 'LOW', population: 44870 },
  { id: 'zone-07', name: 'Old Town', lat: jitter(CITY_CENTER.lat, 0.14), lng: jitter(CITY_CENTER.lng, 0.14), riskLevel: 'MEDIUM', population: 39120 },
]

const INCIDENT_TYPES: IncidentType[] = [
  'FIRE', 'FLOOD', 'CYCLONE', 'EARTHQUAKE', 'LANDSLIDE', 'INDUSTRIAL_ACCIDENT',
  'POWER_FAILURE', 'NETWORK_OUTAGE', 'ROAD_ACCIDENT', 'MEDICAL_EMERGENCY',
]

const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const DESCRIPTIONS: Record<IncidentType, string[]> = {
  FIRE: ['Structure fire reported in multi-story building', 'Warehouse fire spreading to adjacent lot', 'Brush fire advancing toward residential edge'],
  FLOOD: ['Flash flood warning, water rising along low-lying streets', 'River overflow threatening riverside properties', 'Storm drain failure causing street flooding'],
  CYCLONE: ['Tropical cyclone system approaching coastline', 'High-wind cyclone band moving inland'],
  EARTHQUAKE: ['Moderate tremor detected, aftershocks possible', 'Structural damage reported after seismic event'],
  LANDSLIDE: ['Slope failure blocking access road', 'Debris flow following heavy rainfall'],
  INDUSTRIAL_ACCIDENT: ['Chemical leak reported at processing facility', 'Explosion at manufacturing plant'],
  POWER_FAILURE: ['Substation fault causing rolling outages', 'Transformer failure affecting grid segment'],
  NETWORK_OUTAGE: ['Fiber cut disrupting regional connectivity', 'Cell tower cluster offline'],
  ROAD_ACCIDENT: ['Multi-vehicle collision blocking lanes', 'Overturned freight vehicle on highway'],
  MEDICAL_EMERGENCY: ['Mass casualty event reported', 'Cardiac emergency at public venue'],
}

function makeIncident(zone: Zone, overrideType?: IncidentType, overrideSeverity?: Severity): Incident {
  const type = overrideType ?? pick(INCIDENT_TYPES)
  const severity = overrideSeverity ?? pick(SEVERITIES)
  const status = pick(['DETECTED', 'ASSESSING', 'RESPONDING', 'CONTAINED'] as const)
  const now = Date.now()
  return {
    id: nextId('ORB'),
    type,
    severity,
    status,
    lat: jitter(zone.lat, 0.05),
    lng: jitter(zone.lng, 0.05),
    detectedAt: now - Math.floor(randRange(2, 240)) * 60000,
    updatedAt: now,
    description: pick(DESCRIPTIONS[type]),
    affectedPopulation: Math.floor(randRange(50, 8000)),
    radiusKm: Number(randRange(0.5, 6).toFixed(1)),
    responseUnitIds: [],
    estResolutionMinutes: Math.floor(randRange(15, 360)),
    zoneId: zone.id,
  }
}

export function generateIncidents(count = 22): Incident[] {
  const list: Incident[] = []
  for (let i = 0; i < count; i++) {
    list.push(makeIncident(pick(ZONES)))
  }
  return list
}

const RESOURCE_TYPES: ResourceType[] = [
  'AMBULANCE', 'FIRE_TRUCK', 'POLICE', 'HELICOPTER', 'RESCUE_TEAM', 'MEDICAL_TEAM', 'SHELTER',
]
const TEAM_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet']

function makeResource(): EmergencyResource {
  const type = pick(RESOURCE_TYPES)
  const zone = pick(ZONES)
  const lat = jitter(zone.lat, 0.08)
  const lng = jitter(zone.lng, 0.08)
  const status = pick(['AVAILABLE', 'DEPLOYED', 'EN_ROUTE', 'OFFLINE', 'MAINTENANCE'] as const)
  return {
    id: nextId(prefixForResource(type)),
    type,
    lat, lng,
    homeLat: lat, homeLng: lng,
    status,
    assignedIncidentId: null,
    fuel: Math.floor(randRange(20, 100)),
    team: `${pick(TEAM_NAMES)}-${Math.floor(randRange(1, 9))}`,
    etaMinutes: status === 'EN_ROUTE' ? Math.floor(randRange(3, 25)) : null,
  }
}

function prefixForResource(type: ResourceType): string {
  switch (type) {
    case 'AMBULANCE': return 'AMB'
    case 'FIRE_TRUCK': return 'FTR'
    case 'POLICE': return 'PLC'
    case 'HELICOPTER': return 'HEL'
    case 'RESCUE_TEAM': return 'RES'
    case 'MEDICAL_TEAM': return 'MED'
    case 'SHELTER': return 'SHL'
    default: return 'RES'
  }
}

export function generateResources(count = 32): EmergencyResource[] {
  const list: EmergencyResource[] = []
  for (let i = 0; i < count; i++) list.push(makeResource())
  return list
}

const INFRA_TYPES: InfrastructureType[] = [
  'POWER_GRID', 'WATER', 'HOSPITAL', 'BRIDGE', 'ROAD', 'COMM_TOWER', 'INDUSTRIAL', 'AIRPORT',
]
const INFRA_NAMES: Record<InfrastructureType, string[]> = {
  POWER_GRID: ['Substation North', 'Substation South', 'Grid Node 7'],
  WATER: ['Water Treatment Plant', 'Reservoir Pumping Station'],
  HOSPITAL: ['Meridian General', 'St. Averil Medical Center', 'Eastgate Clinic'],
  BRIDGE: ['Harbor Bridge', 'Riverside Crossing'],
  ROAD: ['Route 9 Corridor', 'Central Interchange'],
  COMM_TOWER: ['Comms Relay Alpha', 'Comms Relay Beta'],
  INDUSTRIAL: ['Processing Facility 3', 'Chemical Storage Yard'],
  AIRPORT: ['Meridian Regional Airport'],
}

function makeInfra(): InfrastructureAsset {
  const type = pick(INFRA_TYPES)
  const zone = pick(ZONES)
  return {
    id: nextId('INF'),
    type,
    name: pick(INFRA_NAMES[type]),
    lat: jitter(zone.lat, 0.07),
    lng: jitter(zone.lng, 0.07),
    health: Math.floor(randRange(35, 100)),
  }
}

export function generateInfrastructure(count = 16): InfrastructureAsset[] {
  const list: InfrastructureAsset[] = []
  for (let i = 0; i < count; i++) list.push(makeInfra())
  return list
}

const ALERT_TEMPLATES: { level: AlertItem['level']; message: string }[] = [
  { level: 'CRITICAL', message: 'Flood level rising near Riverside Flats' },
  { level: 'HIGH', message: 'Power grid instability detected in Central Grid' },
  { level: 'MEDIUM', message: 'Road congestion increasing near Harbor District' },
  { level: 'LOW', message: 'Weather advisory issued for coastal areas' },
  { level: 'HIGH', message: 'Communications relay signal degraded' },
  { level: 'CRITICAL', message: 'Structural integrity warning at Harbor Bridge' },
  { level: 'MEDIUM', message: 'Additional medical unit requested at Eastgate' },
  { level: 'LOW', message: 'Shelter capacity nearing 70 percent' },
]

export function generateAlerts(): AlertItem[] {
  return ALERT_TEMPLATES.map((t, i) => ({
    id: nextId('ALT'),
    level: t.level,
    message: t.message,
    timestamp: Date.now() - i * 240000,
    read: i > 2,
  }))
}

export function generateTimeline(incidents: Incident[]): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const sample = incidents.slice(0, 8)
  sample.forEach((inc, i) => {
    events.push({
      id: nextId('EVT'),
      timestamp: inc.detectedAt,
      text: `Incident ${inc.id} detected — ${inc.type.replace('_', ' ').toLowerCase()}`,
      incidentId: inc.id,
    })
    if (i % 2 === 0) {
      events.push({
        id: nextId('EVT'),
        timestamp: inc.detectedAt + 90000,
        text: `Nearest unit assigned to ${inc.id}`,
        incidentId: inc.id,
      })
    }
  })
  return events.sort((a, b) => a.timestamp - b.timestamp)
}
