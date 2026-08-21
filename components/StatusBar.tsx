'use client'
import React from 'react'

export default function StatusBar({ ambientPlaying, soundError }: { ambientPlaying: boolean; soundError: string | null }){
  return (
    <>
      {soundError ? (
        <div style={{color:'#ffcc00',display:'flex',gap:8,alignItems:'center'}}>{soundError}</div>
      ) : (
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span>{ambientPlaying ? '🔊 Sound on' : '🔇 Sound off'}</span>
        </div>
      )}
    </>
  )
}
