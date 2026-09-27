import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, Satellite, Moon, Sun, Flame } from 'lucide-react'
import { useStore } from '../state/store'
import { severityColor, resourceStatusColor, healthColor, typeLabel } from '../lib/utils'
import { CITY_CENTER } from '../data/demoData'
import type { MapBaseStyle, HeatmapMode, MapLayerKey } from '../types'

const STYLES: Record<MapBaseStyle, string | maplibregl.StyleSpecification> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Esri World Imagery',
      },
    },
    layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
  },
}

function el(className: string, html: string) {
  const d = document.createElement('div')
  d.className = className
  d.innerHTML = html
  return d
}

export function MapView() {
  const { state, dispatch } = useStore()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [loaded, setLoaded] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES.dark,
      center: [CITY_CENTER.lng, CITY_CENTER.lat],
      zoom: 11.4,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.on('load', () => {
      addHeatmapLayer(map)
      setLoaded(true)
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addHeatmapLayer(map: maplibregl.Map) {
    if (map.getSource('heat-src')) return
    map.addSource('heat-src', { type: 'geojson', data: buildHeatGeoJSON(state.heatmapMode) })
    map.addLayer({
      id: 'heat-layer',
      type: 'heatmap',
      source: 'heat-src',
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': 1.1,
        'heatmap-radius': 34,
        'heatmap-opacity': 0.75,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, '#2A7A73',
          0.4, '#49D3C8',
          0.6, '#D9C24E',
          0.8, '#F5A524',
          1, '#E5484D',
        ],
      },
      layout: { visibility: state.layers.heatmap ? 'visible' : 'none' },
    })
  }

  function buildHeatGeoJSON(mode: HeatmapMode): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = []
    if (mode === 'INCIDENT_DENSITY') {
      state.incidents.forEach(i => features.push(point(i.lng, i.lat, i.severity === 'CRITICAL' ? 1 : i.severity === 'HIGH' ? 0.7 : 0.4)))
    } else if (mode === 'RISK_LEVEL') {
      state.zones.forEach(z => features.push(point(z.lng, z.lat, z.riskLevel === 'CRITICAL' ? 1 : z.riskLevel === 'HIGH' ? 0.75 : z.riskLevel === 'MEDIUM' ? 0.5 : 0.25)))
    } else if (mode === 'POPULATION_IMPACT') {
      state.incidents.forEach(i => features.push(point(i.lng, i.lat, Math.min(1, i.affectedPopulation / 8000))))
    } else {
      state.infrastructure.forEach(a => features.push(point(a.lng, a.lat, 1 - a.health / 100)))
    }
    return { type: 'FeatureCollection', features }
  }
  function point(lng: number, lat: number, weight: number): GeoJSON.Feature {
    return { type: 'Feature', properties: { weight }, geometry: { type: 'Point', coordinates: [lng, lat] } }
  }

  // Re-add heatmap layer after base style swap (setStyle clears custom layers)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    map.setStyle(STYLES[state.baseStyle])
    map.once('styledata', () => addHeatmapLayer(map))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.baseStyle])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !map.getLayer('heat-layer')) return
    map.setLayoutProperty('heat-layer', 'visibility', state.layers.heatmap ? 'visible' : 'none')
    const src = map.getSource('heat-src') as maplibregl.GeoJSONSource | undefined
    src?.setData(buildHeatGeoJSON(state.heatmapMode))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.layers.heatmap, state.heatmapMode, state.incidents, state.infrastructure, loaded])

  // Rebuild markers whenever relevant data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (state.layers.zones) {
      state.zones.forEach(z => {
        const size = 26 + Math.min(40, z.population / 4000)
        const node = document.createElement('div')
        node.style.width = `${size}px`
        node.style.height = `${size}px`
        node.style.borderRadius = '999px'
        node.style.border = `1px solid ${severityColor(z.riskLevel)}66`
        node.style.background = `${severityColor(z.riskLevel)}1a`
        node.title = `${z.name} — risk ${z.riskLevel.toLowerCase()}`
        const marker = new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat([z.lng, z.lat]).addTo(map)
        markersRef.current.push(marker)
      })
    }

    if (state.layers.infrastructure) {
      state.infrastructure.forEach(a => {
        const node = document.createElement('div')
        node.style.width = '11px'
        node.style.height = '11px'
        node.style.borderRadius = '3px'
        node.style.background = healthColor(a.health)
        node.style.border = '1px solid rgba(0,0,0,0.4)'
        node.style.cursor = 'pointer'
        const popup = new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(
          `<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:#111">
            <div style="font-weight:600">${a.name}</div>
            <div>${typeLabel(a.type)}</div>
            <div>Health: ${a.health}%</div>
          </div>`,
        )
        const marker = new maplibregl.Marker({ element: node, anchor: 'center' })
          .setLngLat([a.lng, a.lat]).setPopup(popup).addTo(map)
        markersRef.current.push(marker)
      })
    }

    if (state.layers.resources) {
      state.resources.forEach(r => {
        const node = document.createElement('div')
        node.style.width = '9px'
        node.style.height = '9px'
        node.style.borderRadius = '999px'
        node.style.background = resourceStatusColor(r.status)
        node.style.boxShadow = '0 0 0 2px rgba(10,12,16,0.7)'
        node.style.cursor = 'pointer'
        const popup = new maplibregl.Popup({ offset: 8, closeButton: false }).setHTML(
          `<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:#111">
            <div style="font-weight:600">${r.id}</div>
            <div>${typeLabel(r.type)} · ${r.team}</div>
            <div>${typeLabel(r.status)}${r.etaMinutes != null ? ` · ETA ${r.etaMinutes}m` : ''}</div>
          </div>`,
        )
        const marker = new maplibregl.Marker({ element: node, anchor: 'center' })
          .setLngLat([r.lng, r.lat]).setPopup(popup).addTo(map)
        markersRef.current.push(marker)
      })
    }

    if (state.layers.incidents) {
      state.incidents.forEach(i => {
        const wrap = document.createElement('div')
        wrap.style.position = 'relative'
        wrap.style.width = '18px'
        wrap.style.height = '18px'
        wrap.style.cursor = 'pointer'
        const dot = document.createElement('div')
        dot.style.position = 'absolute'
        dot.style.inset = '4px'
        dot.style.borderRadius = '999px'
        dot.style.background = severityColor(i.severity)
        dot.style.border = i.id === state.selectedIncidentId ? '2px solid #fff' : '1px solid rgba(0,0,0,0.5)'
        wrap.appendChild(dot)
        if (i.severity === 'CRITICAL') {
          const ring = document.createElement('div')
          ring.style.position = 'absolute'
          ring.style.inset = '0'
          ring.style.borderRadius = '999px'
          ring.style.border = `2px solid ${severityColor(i.severity)}`
          ring.className = 'animate-pulse-ring'
          wrap.appendChild(ring)
        }
        wrap.addEventListener('click', ev => {
          ev.stopPropagation()
          dispatch({ type: 'SELECT_INCIDENT', id: i.id })
        })
        const marker = new maplibregl.Marker({ element: wrap, anchor: 'center' })
          .setLngLat([i.lng, i.lat]).addTo(map)
        markersRef.current.push(marker)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.incidents, state.resources, state.infrastructure, state.zones, state.layers, state.selectedIncidentId, loaded])

  const layerToggles: { key: MapLayerKey; label: string }[] = [
    { key: 'incidents', label: 'Incidents' },
    { key: 'resources', label: 'Resources' },
    { key: 'infrastructure', label: 'Infrastructure' },
    { key: 'zones', label: 'Zones' },
    { key: 'heatmap', label: 'Heatmap' },
  ]

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />

      <button
        onClick={() => setPanelOpen(o => !o)}
        className="focus-ring absolute top-3 left-3 z-10 glass rounded-md p-2 text-ink-dim hover:text-ink"
        aria-label="Toggle map layers panel"
      >
        <Layers size={16} />
      </button>

      {panelOpen && (
        <div className="absolute top-3 left-14 z-10 glass rounded-md p-3 w-56 text-[12px]">
          <div className="flex items-center gap-1 mb-2">
            {(['dark', 'light', 'satellite'] as MapBaseStyle[]).map(s => (
              <button
                key={s}
                onClick={() => dispatch({ type: 'SET_BASE_STYLE', style: s })}
                className={`focus-ring flex-1 flex items-center justify-center gap-1 py-1 rounded border text-[11px]
                  ${state.baseStyle === s ? 'border-signal text-signal bg-signal/10' : 'border-line text-ink-dim'}`}
              >
                {s === 'dark' && <Moon size={12} />}
                {s === 'light' && <Sun size={12} />}
                {s === 'satellite' && <Satellite size={12} />}
                <span className="capitalize">{s}</span>
              </button>
            ))}
          </div>
          <div className="h-px bg-line my-2" />
          {layerToggles.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between py-1 cursor-pointer text-ink-dim">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={state.layers[key]}
                onChange={() => dispatch({ type: 'TOGGLE_LAYER', key })}
                className="accent-signal"
              />
            </label>
          ))}
          {state.layers.heatmap && (
            <>
              <div className="h-px bg-line my-2" />
              <div className="flex items-center gap-1 text-ink-faint mb-1"><Flame size={11} /> Heatmap mode</div>
              <select
                value={state.heatmapMode}
                onChange={e => dispatch({ type: 'SET_HEATMAP_MODE', mode: e.target.value as HeatmapMode })}
                className="focus-ring w-full bg-white/[0.04] border border-line rounded px-1.5 py-1 text-ink text-[11px]"
              >
                <option value="INCIDENT_DENSITY">Incident density</option>
                <option value="RISK_LEVEL">Risk level</option>
                <option value="POPULATION_IMPACT">Population impact</option>
                <option value="INFRASTRUCTURE_RISK">Infrastructure risk</option>
              </select>
            </>
          )}
        </div>
      )}
    </div>
  )
}
