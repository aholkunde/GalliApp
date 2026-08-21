'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import eventsData, { GalliEvent } from '../data/events'
import EventOverlay from './EventOverlay'
import Controls from './Controls'
import StatusBar from './StatusBar'

type LastFiredMap = Record<string, number>
type ActionName = 'chai' | 'horn' | 'status'

const ACTION_COOLDOWNS: Record<ActionName, number> = {
  chai: 5000,
  horn: 1200,
  status: 2000,
}

const AMBIENT_STATUS_EVENT: GalliEvent = {
  id: 'ambient-status',
  character: 'GALLI',
  dialogue: 'The street is breathing. Stay a little longer — another moment is unfolding.',
  category: 'environment',
  weight: 0,
  cooldownSeconds: 0,
}

export default function GalliExperience() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [entered, setEntered] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [soundError, setSoundError] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<GalliEvent | null>(null)
  const [chaiCount, setChaiCount] = useState(0)
  const [powerCut, setPowerCut] = useState(false)
  const [rain, setRain] = useState(false)
  const [vehicleActive, setVehicleActive] = useState(false)
  const [hornActive, setHornActive] = useState(false)

  const lastFired = useRef<LastFiredMap>({})
  const lastEventIds = useRef<string[]>([])
  const lastActionAt = useRef<Partial<Record<ActionName, number>>>({})
  const eventTimer = useRef<number | null>(null)
  const eventClearTimer = useRef<number | null>(null)
  const managedTimers = useRef<Set<number>>(new Set())
  const eventActive = useRef(false)

  const clearManagedTimer = useCallback((timer: number | null) => {
    if (timer === null) return
    window.clearTimeout(timer)
    managedTimers.current.delete(timer)
  }, [])

  const setManagedTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      managedTimers.current.delete(timer)
      callback()
    }, delay)
    managedTimers.current.add(timer)
    return timer
  }, [])

  useEffect(() => {
    return () => {
      managedTimers.current.forEach(timer => window.clearTimeout(timer))
      managedTimers.current.clear()
    }
  }, [])

  const actionAllowed = useCallback((action: ActionName) => {
    const now = Date.now()
    const last = lastActionAt.current[action] ?? 0
    if (now - last < ACTION_COOLDOWNS[action]) return false
    lastActionAt.current[action] = now
    return true
  }, [])

  const hideCurrentEvent = useCallback(() => {
    setCurrentEvent(null)
    eventActive.current = false
    eventClearTimer.current = null
  }, [])

  const showEvent = useCallback((event: GalliEvent, duration = 6000) => {
    clearManagedTimer(eventClearTimer.current)
    eventActive.current = true
    setCurrentEvent(event)
    eventClearTimer.current = setManagedTimeout(hideCurrentEvent, duration)
  }, [clearManagedTimer, hideCurrentEvent, setManagedTimeout])

  const weightedPick = useCallback((list: GalliEvent[]) => {
    const filtered = list.filter(event => !lastEventIds.current.includes(event.id))
    const pool = filtered.length ? filtered : list
    const total = pool.reduce((sum, event) => sum + event.weight, 0)
    let random = Math.random() * total

    for (const event of pool) {
      random -= event.weight
      if (random <= 0) return event
    }

    return pool[0]
  }, [])

  const pickEvent = useCallback(() => {
    const now = Date.now()
    const candidates = eventsData.filter(event => {
      const last = lastFired.current[event.id] ?? 0
      return (now - last) / 1000 >= event.cooldownSeconds
    })

    if (!candidates.length) return null

    const rarePool = candidates.filter(event => event.category === 'rare')
    if (rarePool.length && Math.random() < 0.05) return weightedPick(rarePool)

    const normalPool = candidates.filter(event => event.category !== 'rare')
    return weightedPick(normalPool.length ? normalPool : candidates)
  }, [weightedPick])

  const scheduleNextEvent: (options?: { initial?: boolean }) => void = useCallback((options = {}) => {
    clearManagedTimer(eventTimer.current)
    const initial = options.initial === true
    const baseGap = initial
      ? 8000 + Math.random() * 7000
      : 15000 + Math.random() * 20000
    const quietGap = !initial && Math.random() < 0.2
      ? 15000 + Math.random() * 45000
      : 0

    eventTimer.current = setManagedTimeout(() => {
      if (eventActive.current) {
        scheduleNextEvent()
        return
      }

      const event = pickEvent()
      if (!event) {
        scheduleNextEvent()
        return
      }

      lastFired.current[event.id] = Date.now()
      lastEventIds.current = [event.id, ...lastEventIds.current].slice(0, 3)
      showEvent(event)

      if (event.id === 'rain1') {
        setRain(true)
        setManagedTimeout(() => setRain(false), 10000)
      }

      if (event.id === 'power_cut') {
        setPowerCut(true)
        setManagedTimeout(() => setPowerCut(false), 2500)
      }

      if (event.category === 'traffic') {
        setVehicleActive(true)
        setManagedTimeout(() => setVehicleActive(false), 3000)
      }

      scheduleNextEvent()
    }, baseGap + quietGap)
  }, [clearManagedTimer, pickEvent, setManagedTimeout, showEvent])

  function enterGalli() {
    const video = videoRef.current
    setEntered(true)
    setSoundOn(true)
    setSoundError(null)

    if (video) {
      video.volume = 0.45
      video.muted = false
      void video.play().catch(error => {
        console.warn('Video audio playback failed', error)
        setSoundOn(false)
        setSoundError('⚠️ Tap sound to retry')
      })
    }

    scheduleNextEvent({ initial: true })
  }

  function handleOrderChai() {
    if (!actionAllowed('chai')) return
    const chaiEvent = eventsData.find(event => event.id === 'chicha')
    if (!chaiEvent) return

    setChaiCount(count => count + 1)
    lastFired.current[chaiEvent.id] = Date.now()
    showEvent(chaiEvent, 4500)
  }

  function handleHorn() {
    if (!actionAllowed('horn')) return

    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        const context = new AudioContextClass()
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sawtooth'
        oscillator.frequency.value = 220
        gain.gain.value = 0.08
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start()
        setManagedTimeout(() => {
          oscillator.stop()
          void context.close()
        }, 180)
      }
    } catch (error) {
      console.warn('Horn failed', error)
    }

    setHornActive(true)
    setManagedTimeout(() => setHornActive(false), 900)
  }

  function toggleSound() {
    const video = videoRef.current
    if (!video) return

    if (soundOn) {
      video.muted = true
      setSoundOn(false)
      return
    }

    video.volume = 0.45
    video.muted = false
    setSoundOn(true)
    void video.play()
      .then(() => setSoundError(null))
      .catch(error => {
        console.warn('Video audio playback failed', error)
        setSoundOn(false)
        setSoundError('⚠️ Tap sound to retry')
      })
  }

  function handleWhatsHappening() {
    if (!actionAllowed('status') || currentEvent) return
    showEvent(AMBIENT_STATUS_EVENT, 3500)
  }

  return (
    <div className={`main-viewport ${powerCut ? 'power-cut' : ''}`}>
      <video
        ref={videoRef}
        className="video-full"
        autoPlay
        muted={!entered || !soundOn}
        loop
        playsInline
        preload="auto"
      >
        <source src="/videos/hyderabad-base.MP4" type="video/mp4" />
      </video>

      {entered ? (
        <>
          <div className="status-bar" role="status">
            <StatusBar ambientPlaying={soundOn} soundError={soundError} />
          </div>

          {rain ? (
            <div className="rain-overlay" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, index) => (
                <div key={index} className={`rain-drop rain-drop-${index + 1}`} />
              ))}
            </div>
          ) : null}

          {currentEvent ? <EventOverlay event={currentEvent} /> : (
            <div className="alive-indicator">
              <span className="alive-pulse">●</span> Galli is alive · next moment unfolding…
            </div>
          )}

          {vehicleActive ? <div className="vehicle slide">🛺 Passing auto</div> : null}
          {hornActive ? <div className="event-overlay horn-overlay" role="status">POOOONK 📣</div> : null}

          <div className="controls-tray">
            <div className="controls-grid">
              <Controls
                onOrderChai={handleOrderChai}
                onHorn={handleHorn}
                onToggleSound={toggleSound}
                onWhatsHappening={handleWhatsHappening}
                soundOn={soundOn}
                chaiCount={chaiCount}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="cinematic-overlay">
          <h1>GALLI 500004</h1>
          <h2>HYDERABAD AFTER HOURS</h2>
          <p>Ek chai. Thoda traffic. Thodi bakchodi. Stay long enough and the galli starts telling stories.</p>
          <button className="enter-btn" onClick={enterGalli}>ENTER THE GALLI</button>
        </div>
      )}
    </div>
  )
}

