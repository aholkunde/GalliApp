import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Galli 500004 — Hyderabad After Hours',
  description: 'A small Next.js POC: endless Hyderabad ambient experience.'
}

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
