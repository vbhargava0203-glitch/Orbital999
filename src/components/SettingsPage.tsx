import { useStore } from '../state/store'

export function SettingsPage() {
  const { dispatch } = useStore()

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <h1 className="text-lg text-ink font-medium mb-1">Settings</h1>
      <p className="text-ink-dim text-[13px] mb-5">Environment information and demo controls.</p>

      <div className="glass rounded-md p-4 space-y-3 text-[13px] mb-4">
        <Row label="Application" value="ORBITAL — Crisis Intelligence Platform" />
        <Row label="Version" value="1.0.0" />
        <Row label="Environment" value="Simulated demo data" />
        <Row label="Map provider" value="MapLibre GL (CARTO / Esri tiles)" />
      </div>

      <div className="glass rounded-md p-4">
        <div className="text-ink text-[13px] mb-1">Reset demo environment</div>
        <p className="text-ink-dim text-[12px] mb-3">Regenerates incidents, resources, infrastructure, and alerts, and stops any running simulation.</p>
        <button
          onClick={() => dispatch({ type: 'RESET_DEMO' })}
          className="focus-ring text-[12px] px-3 py-1.5 rounded border border-line text-ink-dim hover:text-ink hover:border-white/20"
        >
          Reset data
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line last:border-0 pb-2 last:pb-0">
      <span className="text-ink-faint">{label}</span>
      <span className="text-ink font-mono text-[12px]">{value}</span>
    </div>
  )
}
