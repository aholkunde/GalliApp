# Galli 500004 — Hyderabad After Hours

A Next.js proof-of-concept for an endless, ambient Hyderabad street experience. Designed mobile-first for iPhone and modern mobile viewports.

Features

- Fullscreen looping base video (user-provided MP4 at /public/videos/hyderabad-base.mp4).
- Ambient looping audio (user-provided MP3 at /public/audio/ambient.mp3).
- Entry cinematic overlay with "ENTER THE GALLI" gesture to start video and audio.
- Random event engine with dialogues, rare events (power cut), rain effect, passing vehicle.
- Mobile-friendly bottom controls (Order Chai, Horn, Sound toggle, What's happening).
- No backend, no database, minimal dependencies. Ready for Vercel.

Project structure

GalliApp/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── GalliExperience.tsx
│   ├── EventOverlay.tsx
│   ├── Controls.tsx
│   └── StatusBar.tsx
├── data/
│   └── events.ts
├── public/
│   ├── videos/
│   │   └── hyderabad-base.mp4 (PLACEHOLDER)
│   └── audio/
│       └── ambient.mp3 (PLACEHOLDER)
├── package.json
└── README.md

Setup

1. Install dependencies:

   npm install

2. Run development server:

   npm run dev

3. Build:

   npm run build

Expected media paths

- Base video: public/videos/hyderabad-base.mp4 (MP4 required)
- Ambient audio: public/audio/ambient.mp3

How it works

- The entry screen requires a user gesture (tap) to start the video and audio playback so iOS/Safari will allow sound.
- Ambient audio is started from the same user gesture to avoid autoplay restrictions.
- Events are scheduled with pacing and cooldowns. Rare events are rare (~5%).

Adding events

Edit data/events.ts and add objects matching the GalliEvent type. Fields:

- id: unique string
- character: display name
- dialogue: text to show
- category: one of conversation|traffic|chai|nostalgia|environment|rare
- weight: selection weight
- cooldownSeconds: seconds before it can be shown again

Future event-video architecture

Events support optional video/audio/duration fields. The current POC shows overlays and simple CSS effects. In future:

- Add event.video: path to MP4
- On event start, temporarily show the event video (unmuted or mixed) over the base scene
- When done, return to the base looping video seamlessly

Deployment to Vercel

- This is a standard Next.js app; connect your GitHub repo to Vercel and deploy. Ensure you upload the media files to the public/ directory.

Notes

- The project uses only TypeScript, React, Next.js, and CSS. No external UI libraries.
- For best mobile results test at 390×844 and on iPhone Safari.
