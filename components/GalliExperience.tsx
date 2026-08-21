'use client'

import React, { useEffect, useRef, useState } from 'react'
import eventsData, { GalliEvent } from '../data/events'
import EventOverlay from './EventOverlay'
import Controls from './Controls'
import StatusBar from './StatusBar'

type LastFiredMap = Record<string, number>

export default function GalliExperience(){
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [entered, setEntered] = useState(false)
  const [ambientPlaying, setAmbientPlaying] = useState(false)
  const [soundError, setSoundError] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<GalliEvent | null>(null)
  const lastFired = useRef<LastFiredMap>({})
  const lastEventIds = useRef<string[]>([])
  const [chaiCount, setChaiCount] = useState(0)
  const [powerCut, setPowerCut] = useState(false)
  const [rain, setRain] = useState(false)
  const eventTimer = useRef<number | null>(null)

  useEffect(()=>{
    return ()=>{
      if(eventTimer.current) window.clearTimeout(eventTimer.current)
    }
  },[])

  function enterGalli(){
    setEntered(true)
  
    const video = videoRef.current
    if(video){
      video.volume = 0.45
      video.muted = false
  
      video.play()
        .then(() => {
          setAmbientPlaying(true)
          setSoundError(null)
        })
        .catch((error) => {
          console.warn('Video audio playback failed', error)
          setAmbientPlaying(false)
          setSoundError('⚠️ Tap sound to retry')
        })
    }
  
    scheduleNextEvent({initial:true})
  }

  function scheduleNextEvent(opts: {initial?:boolean} = {}){
    const initial = !!opts.initial
    const gap = initial ? (8000 + Math.random()*7000) : (15000 + Math.random()*20000)
    const larger = Math.random() < 0.2
    const scheduled = gap + (larger ? (15000 + Math.random()*45000) : 0)
    if(eventTimer.current) window.clearTimeout(eventTimer.current)
    eventTimer.current = window.setTimeout(()=>{
      triggerRandomEvent()
    }, scheduled)
  }

  function pickEvent(){
    const now = Date.now()
    // filter by cooldown
    const candidates = eventsData.filter(e=>{
      const last = lastFired.current[e.id] || 0
      return (now - last) / 1000 >= e.cooldownSeconds
    })
    if(candidates.length === 0) return null

    // apply rare probability
    const rarePool = candidates.filter(c=>c.category === 'rare')
    if(rarePool.length && Math.random() < 0.05){
      return weightedPick(rarePool)
    }

    // normal pool
    const normal = candidates.filter(c=>c.category !== 'rare')
    if(normal.length===0) return weightedPick(candidates)
    return weightedPick(normal)
  }

  function weightedPick(list: GalliEvent[]){
    // avoid last 3
    const filtered = list.filter(l => !lastEventIds.current.includes(l.id))
    const pool = filtered.length ? filtered : list
    const total = pool.reduce((s,p)=>s+p.weight,0)
    const r = Math.random()*total
    let acc = 0
    for(const item of pool){
      acc += item.weight
      if(r <= acc) return item
    }
    return pool[0]
  }

  function triggerRandomEvent(){
    const e = pickEvent()
    if(!e){
      scheduleNextEvent()
      return
    }

    // update history and cooldown
    lastFired.current[e.id] = Date.now()
    lastEventIds.current.unshift(e.id)
    if(lastEventIds.current.length > 3) lastEventIds.current.pop()

    // handle visual effects
    setCurrentEvent(e)
    if(e.category === 'environment' && e.id === 'rain1'){
      setRain(true)
      window.setTimeout(()=>setRain(false), 10000)
    }
    if(e.id === 'power_cut'){
      setPowerCut(true)
      window.setTimeout(()=>setPowerCut(false), 2500)
    }
    if(e.category === 'traffic'){
      // show vehicle briefly
      triggerVehicle()
    }

    // schedule hide
    window.setTimeout(()=>{
      setCurrentEvent(null)
    }, 6000)

    // next event
    scheduleNextEvent()
  }

  function triggerVehicle(){
    const el = document.createElement('div')
    el.className = 'vehicle'
    el.textContent = '🛺 Passing auto'
    document.body.appendChild(el)
    // force layout
    void el.offsetWidth
    el.classList.add('slide')
    setTimeout(()=>{el.remove()}, 3000)
  }

  function handleOrderChai(){
    setChaiCount(c => c+1)
    // show a short event
    const chaiEvent = eventsData.find(ev=>ev.id==='chicha')
    if(chaiEvent){
      // temporarily display
      setCurrentEvent(chaiEvent)
      window.setTimeout(()=>setCurrentEvent(null),4500)
    }
  }

  function handleHorn(){
    // simple oscillator beep
    try{
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if(Ctx){
        const ctx = new Ctx()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sawtooth'
        o.frequency.value = 220
        g.gain.value = 0.08
        o.connect(g);g.connect(ctx.destination)
        o.start()
        setTimeout(()=>{o.stop();ctx.close()},180)
      }
    }catch(err){console.warn('Horn failed',err)}
    // small visual
    const el = document.createElement('div')
    el.className='event-overlay'
    el.textContent = 'POOOONK 📣'
    document.body.appendChild(el)
    setTimeout(()=>{el.remove()},900)
  }

  function toggleSound(){
    const video = videoRef.current
    if(!video) return
    
    if(ambientPlaying){
      video.muted = true
      setAmbientPlaying(false)
    }else{
      video.muted = false
      video.volume = 0.45
      video.play()
        .then(()=>{
          setAmbientPlaying(true)
          setSoundError(null)
        })
        .catch((error)=>{
          console.warn('Video audio playback failed', error)
          setSoundError('⚠️ Tap sound to retry')
        })
    }
  }

  return (
    <div className={`main-viewport ${powerCut ? 'power-cut' : ''}`}>
      <div className="status-bar" role="status">
        <StatusBar ambientPlaying={ambientPlaying} soundError={soundError} />
      </div>

      {!entered && (
        <div className="cinematic-overlay">
          <h1>GALLI 500004</h1>
          <h2>HYDERABAD AFTER HOURS</h2>
          <p>Ek chai. Thoda traffic. Thodi bakchodi. Stay long enough and the galli starts telling stories.</p>
          <button className="enter-btn" onClick={enterGalli}>ENTER THE GALLI</button>
        </div>
      )}

      <video
        ref={videoRef}
        className="video-full"
        autoPlay
        muted={!entered}
        loop
        playsInline
        preload="auto"
      >
        <source src="/videos/hyderabad-base.MP4" type="video/mp4" />
      </video>

      {rain && (
        <div className="rain-overlay" aria-hidden>
          {Array.from({length:16}).map((_,i)=> (
            <div key={i} className="rain-drop" style={{left: `${Math.random()*100}%`, animationDelay: `${Math.random()*0.6}s`, height: `${30+Math.random()*60}vh`}} />
          ))}
        </div>
      )}

      {currentEvent && (
        <EventOverlay event={currentEvent} />
      )}

      {entered && !currentEvent && (
        <div className="alive-indicator">
          <span className="alive-pulse">●</span> Galli is alive · next moment unfolding…
        </div>
      )}

      <div className="controls-tray">
        <div className="controls-grid">
          <Controls
            onOrderChai={handleOrderChai}
            onHorn={handleHorn}
            onToggleSound={toggleSound}
            onWhatsHappening={()=>{if(currentEvent) window.alert(currentEvent.dialogue)}}
            soundOn={ambientPlaying}
            chaiCount={chaiCount}
          />
        </div>
      </div>
    </div>
  )
}
