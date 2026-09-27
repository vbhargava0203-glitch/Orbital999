import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, ListTree } from 'lucide-react'
import { useStore } from '../state/store'
import { formatTime } from '../lib/utils'

export function EventTimeline() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const events = [...state.timeline].reverse().slice(0, 60)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
  }, [state.timeline.length])

  return (
    <div className="glass border-t border-line shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="focus-ring w-full flex items-center gap-2 px-4 py-1.5 text-[11px] text-ink-dim hover:text-ink"
      >
        <ListTree size={13} />
        <span className="font-mono uppercase tracking-wide">Live event timeline</span>
        {open ? <ChevronDown size={14} className="ml-auto" /> : <ChevronUp size={14} className="ml-auto" />}
      </button>
      {open && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1 h-[86px]">
          {events.map(e => (
            <button
              key={e.id}
              onClick={() => e.incidentId && dispatch({ type: 'SELECT_INCIDENT', id: e.incidentId })}
              className="focus-ring shrink-0 w-64 text-left border border-line rounded-md px-3 py-2 hover:border-white/20 hover:bg-white/[0.03]"
            >
              <div className="font-mono text-[11px] text-signal">{formatTime(e.timestamp)}</div>
              <div className="text-[12px] text-ink-dim leading-snug mt-0.5 line-clamp-2">{e.text}</div>
            </button>
          ))}
          {events.length === 0 && <div className="text-ink-faint text-[12px] py-4">No events yet.</div>}
        </div>
      )}
    </div>
  )
}
