import type { Severity, IncidentStatus, ResourceStatus, AlertLevel } from '../types'

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour12: false })
}

export function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function severityColor(s: Severity): string {
  switch (s) {
    case 'CRITICAL': return '#E5484D'
    case 'HIGH': return '#F5A524'
    case 'MEDIUM': return '#D9C24E'
    case 'LOW': return '#7C8797'
    default: return '#7C8797'
  }
}

export function alertLevelColor(l: AlertLevel): string {
  return severityColor(l as Severity)
}

export function statusLabel(s: IncidentStatus): string {
  return s.replace(/_/g, ' ')
}

export function resourceStatusColor(s: ResourceStatus): string {
  switch (s) {
    case 'AVAILABLE': return '#49D3C8'
    case 'DEPLOYED': return '#8B94A3'
    case 'EN_ROUTE': return '#F5A524'
    case 'OFFLINE': return '#5B6472'
    case 'MAINTENANCE': return '#D9C24E'
    default: return '#8B94A3'
  }
}

export function typeLabel(t: string): string {
  return t.replace(/_/g, ' ')
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function formatNumber(n: number): string {
  return n.toLocaleString()
}

export function healthLabel(health: number): string {
  if (health >= 90) return 'HEALTHY'
  if (health >= 70) return 'DEGRADED'
  if (health >= 45) return 'WARNING'
  return 'CRITICAL'
}

export function healthColor(health: number): string {
  if (health >= 90) return '#49D3C8'
  if (health >= 70) return '#D9C24E'
  if (health >= 45) return '#F5A524'
  return '#E5484D'
}
