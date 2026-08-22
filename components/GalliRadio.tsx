'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEO_ID = 'A3NTY8AjzK8'

type PlayerStateEvent = { data: number }
type PlayerErrorEvent = { data: number }

type YouTubePlayer = {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  getVideoData: () => { title?: string; author?: string }
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setVolume: (volume: number) => void
}

type YouTubeNamespace = {
  Player: new (element: HTMLElement, options: {
    videoId: string
    playerVars: Record<string, string | number>
    events: {
      onReady: () => void
      onStateChange: (event: PlayerStateEvent) => void
      onError: (event: PlayerErrorEvent) => void
    }
  }) => YouTubePlayer
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.()
      if (window.YT) resolve(window.YT)
      else reject(new Error('YouTube player API did not initialize'))
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    if (existingScript) return

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => reject(new Error('Unable to load YouTube player API'))
    document.head.appendChild(script)
  })

  return youtubeApiPromise
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const rounded = Math.floor(seconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const remainingSeconds = rounded % 60
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function GalliRadio({
  open,
  onClose,
  ambienceVolume,
  onAmbienceVolumeChange,
}: {
  open: boolean
  onClose: () => void
  ambienceVolume: number
  onAmbienceVolumeChange: (volume: number) => void
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [musicVolume, setMusicVolume] = useState(65)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [title, setTitle] = useState('Galli Radio · Long Drive Mix')
  const [artist, setArtist] = useState('YouTube')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedVolume = window.sessionStorage.getItem('galli-radio-volume')
    if (savedVolume) {
      const parsed = Number(savedVolume)
      if (Number.isFinite(parsed)) setMusicVolume(Math.min(100, Math.max(0, parsed)))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let player: YouTubePlayer | null = null

    void loadYouTubeApi()
      .then(YT => {
        if (cancelled || !hostRef.current) return
        player = new YT.Player(hostRef.current, {
          videoId: VIDEO_ID,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!player || cancelled) return
              playerRef.current = player
              player.setVolume(musicVolume)
              setDuration(player.getDuration())
              const videoData = player.getVideoData()
              if (videoData.title) setTitle(videoData.title)
              if (videoData.author) setArtist(videoData.author)
              setReady(true)
            },
            onStateChange: event => {
              setPlaying(event.data === YT.PlayerState.PLAYING)
              if (event.data === YT.PlayerState.ENDED) setCurrentTime(0)
            },
            onError: event => {
              setError(`This track could not be played here (YouTube error ${event.data}).`)
              setPlaying(false)
            },
          },
        })
      })
      .catch(() => setError('Galli Radio could not connect to YouTube.'))

    return () => {
      cancelled = true
      playerRef.current = null
      player?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    playerRef.current?.setVolume(musicVolume)
    window.sessionStorage.setItem('galli-radio-volume', String(musicVolume))
  }, [musicVolume, ready])

  useEffect(() => {
    if (!ready || !playing) return
    const timer = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      setCurrentTime(player.getCurrentTime())
      setDuration(player.getDuration())
    }, 500)
    return () => window.clearInterval(timer)
  }, [playing, ready])

  function togglePlayback() {
    const player = playerRef.current
    if (!player || !ready) return
    if (playing) player.pauseVideo()
    else player.playVideo()
  }

  function seekBy(seconds: number) {
    const player = playerRef.current
    if (!player) return
    player.seekTo(Math.max(0, Math.min(duration, player.getCurrentTime() + seconds)), true)
  }

  function seekTo(value: number) {
    playerRef.current?.seekTo(value, true)
    setCurrentTime(value)
  }

  return (
    <>
      <div className="youtube-player-host" ref={hostRef} aria-hidden="true" />
      {open ? (
        <section className="radio-panel" role="dialog" aria-modal="false" aria-label="Galli Radio">
          <div className="radio-header">
            <div className="radio-art" aria-hidden="true">♫</div>
            <div className="radio-track-copy">
              <span className="radio-kicker">GALLI RADIO · ONE LONG TRACK</span>
              <strong title={title}>{title}</strong>
              <span>{artist}</span>
            </div>
            <button className="radio-close" onClick={onClose} aria-label="Close Galli Radio">×</button>
          </div>

          {error ? (
            <div className="radio-error" role="alert">
              <span>{error}</span>
              <a href={`https://www.youtube.com/watch?v=${VIDEO_ID}`} target="_blank" rel="noreferrer">Open on YouTube</a>
            </div>
          ) : (
            <>
              <label className="radio-progress-label">
                <span className="sr-only">Track position</span>
                <input
                  className="radio-progress"
                  type="range"
                  min="0"
                  max={Math.max(duration, 1)}
                  step="1"
                  value={Math.min(currentTime, Math.max(duration, 1))}
                  onChange={event => seekTo(Number(event.target.value))}
                  disabled={!ready}
                />
              </label>
              <div className="radio-time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>

              <div className="radio-transport">
                <button onClick={() => seekBy(-15)} disabled={!ready} aria-label="Rewind 15 seconds">↶ 15</button>
                <button className="radio-play" onClick={togglePlayback} disabled={!ready} aria-label={playing ? 'Pause music' : 'Play music'}>
                  {playing ? 'Ⅱ' : '▶'}
                </button>
                <button onClick={() => seekBy(15)} disabled={!ready} aria-label="Forward 15 seconds">15 ↷</button>
              </div>
            </>
          )}

          <div className="radio-mixer">
            <label>
              <span><span aria-hidden="true">🎵</span> Music <output>{musicVolume}%</output></span>
              <input type="range" min="0" max="100" value={musicVolume} onChange={event => setMusicVolume(Number(event.target.value))} />
            </label>
            <label>
              <span><span aria-hidden="true">🌃</span> Street ambience <output>{Math.round(ambienceVolume * 100)}%</output></span>
              <input type="range" min="0" max="100" value={Math.round(ambienceVolume * 100)} onChange={event => onAmbienceVolumeChange(Number(event.target.value) / 100)} />
            </label>
          </div>

          <a className="radio-youtube-link" href={`https://www.youtube.com/watch?v=${VIDEO_ID}`} target="_blank" rel="noreferrer">Open track on YouTube ↗</a>
        </section>
      ) : null}
    </>
  )
}

