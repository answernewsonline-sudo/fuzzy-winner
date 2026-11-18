'use client'

import { useEffect, useRef } from 'react'
import { initGalaxy } from '@/lib/galaxy-background'

export function GalaxyBackground() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initGalaxy(hostRef.current)
  }, [])

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas className="mast-gl block h-full w-full" />
    </div>
  )
}
