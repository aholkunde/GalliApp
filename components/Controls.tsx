'use client'
import React from 'react'

export default function Controls({ onOrderChai, onHorn, onToggleSound, onWhatsHappening, soundOn, chaiCount } : {
  onOrderChai: ()=>void;
  onHorn: ()=>void;
  onToggleSound: ()=>void;
  onWhatsHappening: ()=>void;
  soundOn: boolean;
  chaiCount: number;
}){
  return (
    <>
      <button className="control-btn" onClick={onOrderChai} aria-label="Order Chai">
        <span className="control-emoji">☕</span>
        <span className="control-label">Order Chai{chaiCount>0?` (${chaiCount})`:''}</span>
      </button>

      <button className="control-btn" onClick={onHorn} aria-label="Horn">
        <span className="control-emoji">📣</span>
        <span className="control-label">Horn</span>
      </button>

      <button className="control-btn" onClick={onToggleSound} aria-pressed={soundOn} aria-label="Toggle sound">
        <span className="control-emoji">{soundOn ? '🔊' : '🔇'}</span>
        <span className="control-label">Sound</span>
      </button>

      <button className="control-btn" onClick={onWhatsHappening} aria-label="What's happening">
        <span className="control-emoji">👀</span>
        <span className="control-label">What's happening?</span>
      </button>
    </>
  )
}
