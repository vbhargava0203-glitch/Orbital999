# ORBITAL — Real-Time Crisis Intelligence Platform

ORBITAL is a map-centric command-center web app for monitoring simulated
disasters, emergency resources, and infrastructure health in real time. It
ships with a fully wired demo environment: 22+ incidents, 32 emergency
resources, 16 infrastructure assets, live alerts, and a scenario-based
simulation engine — all generated client-side, no backend required.

> All data in this application — incidents, coordinates, population figures,
> resource fleets — is **simulated demo data** for a fictional city
> ("Meridian"). Nothing here reflects a real place or real events.

---

## Quick start

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview
```

No environment variables or API keys are required. The map uses free,
keyless basemaps (CARTO Dark Matter / Positron for the dark and light
styles, Esri World Imagery for the satellite-style layer).

---

## What's implemented

- **Live map** (MapLibre GL) — pan/zoom, three base styles (dark/light/
  satellite), toggleable layers (incidents, resources, infrastructure,
  zones, heatmap), and a heatmap with four selectable modes (incident
  density, risk level, population impact, infrastructure risk).
- **Incident system** — 10 incident types, severity, and a 5-stage status
  lifecycle (Detected → Assessing → Responding → Contained → Resolved).
  Clicking any incident (on the map, in a list, from an alert, or from the
  timeline) opens a detail panel with working actions: dispatch a unit,
  mark contained, escalate.
- **Resource tracking** — 7 resource types with live status (available,
  deployed, en route, offline, maintenance). Dispatched units visibly move
  toward their assigned incident on the map as the realtime engine ticks.
- **Infrastructure monitoring** — health scores with healthy / degraded /
  warning / critical bands, shown on the map and in a dedicated page.
- **Live alerts** — a real-time feed that generates new alerts on an
  interval, independent of whether a simulation is running.
- **Analytics** — incident trend, severity distribution, resource
  utilization, and infrastructure health charts (Recharts), with 24h / 7d /
  30d filters.
- **Simulation mode** — six scenarios (cyclone, flood, earthquake, city
  fire, power grid failure, multi-incident crisis) that spawn
  scenario-appropriate incidents on a timer, plus pause / resume / ×1 ×2 ×5
  speed / stop controls and a visible "Simulation active" indicator.
- **Response dispatch** — from an incident's detail panel, dispatch any
  available unit; it becomes "en route" with an ETA and animates toward
  the incident each tick.
- **Report generator** — filter by period / region / severity and view a
  generated executive summary and incident table; "Export PDF" uses the
  browser's native print-to-PDF.
- **Command palette** — `Ctrl+K` / `Cmd+K` opens a fuzzy-searchable list of
  actions (create incident, open map, start simulation, toggle heatmap,
  etc.).
- **Global search** — the top bar searches incidents, resources,
  infrastructure, and zones as you type.
- **Live event timeline** — a bottom strip that appends new events (status
  changes, dispatches, simulation milestones) as they happen.
- **Responsive layout** — the sidebar collapses into a drawer and the map
  stays primary on small screens; layout uses flexbox throughout.
- **Accessibility** — semantic roles/labels on nav, dialogs, and controls,
  visible focus rings, and a `prefers-reduced-motion` override in
  `src/index.css`.

### Deliberate scope choices

To keep everything on this list **actually working** rather than a
plausible-looking mockup, a few of the original spec's asks were
implemented at a lighter weight:

- "Terrain" as a distinct base layer is not included (no keyless terrain
  tile source exists); satellite/dark/light are provided instead.
- The report generator's PDF export uses the browser print dialog rather
  than a bundled PDF-rendering library, to avoid an unnecessary dependency.
- The realtime engine is a single interval-driven reducer action (`TICK`)
  rather than a separate worker/service — simpler to read and entirely
  sufficient for demo-scale data.

---

## Architecture

```
src/
  types.ts              Shared domain types (Incident, Resource, etc.)
  data/demoData.ts       Deterministic pseudo-random demo data generator
  state/
    store.tsx             React Context + useReducer global store,
                           including the realtime tick loop
    engine.ts             Pure helper functions used by the reducer
                           (status transitions, movement, scenario spawning)
  lib/utils.ts            Formatting + color/label helpers
  components/             One file per page / panel / map / overlay
  App.tsx                 Shell layout: sidebar, top bar, page router,
                           incident detail panel, command palette, toasts
  main.tsx / index.css    Entry point and global styles
```

**State management:** a single `React.useReducer` store, exposed via
context (`useStore()`), avoids pulling in an extra state-management
dependency while keeping all mutations centralized and traceable as
actions (see the `Action` union in `src/state/store.tsx`).

**Realtime engine:** a `setInterval` inside `StoreProvider` dispatches a
`TICK` action every few seconds (faster when a simulation is running, and
scaled further by the ×1/×2/×5 speed control). Each tick can: drift
infrastructure health, move en-route resources toward their incident,
advance an incident's status, generate a new alert, and — during an active
simulation — spawn a scenario-appropriate incident.

**Map:** MapLibre GL is used directly (no React wrapper) for full control.
Incidents/resources/infrastructure are rendered as native MapLibre
`Marker`s rebuilt whenever the relevant slice of state changes; the
heatmap is a GeoJSON source + `heatmap` layer that gets re-attached after
base-style swaps (since `setStyle` clears custom layers).

---

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · MapLibre GL JS · Framer
Motion · Recharts · Lucide icons.

---

## Deployment

This is a static single-page app after `npm run build` (output in `dist/`).
It can be deployed to any static host:

- **Vercel / Netlify:** point the project at this repo, build command
  `npm run build`, output directory `dist`.
- **GitHub Pages:** run `npm run build`, then publish the `dist/` folder
  (e.g. via the `gh-pages` package or a GitHub Actions workflow).
- **Any static file server / S3 / Cloudflare Pages:** upload the contents
  of `dist/` as-is.

No server, database, or environment variables are needed — all data is
generated in the browser at startup.

---

## Pushing to GitHub

This folder is already a git repository with an initial commit. To publish
it:

```bash
git remote add origin git@github.com:<your-username>/orbital.git
git branch -M main
git push -u origin main
```

---

## Known limitations

- Data resets on page reload (no persistence layer) — use Settings →
  "Reset data" to regenerate a fresh demo environment on demand instead.
- The satellite base style uses Esri's public World Imagery tile service;
  for production use, review Esri's terms of use for your intended volume
  and attribution requirements.
