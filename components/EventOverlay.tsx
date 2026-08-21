'use client'
import React from 'react'
import { GalliEvent } from '../data/events'

export default function EventOverlay({ event }: { event: GalliEvent }){
  return (
    <div className="event-overlay" role="status" aria-live="polite">
      <div className="event-character">{event.character} • {event.category.toUpperCase()}</div>
      <div className="event-text">"{event.dialogue}"</div>
    </div>
  )
}
