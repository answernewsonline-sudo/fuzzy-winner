'use client'

import { useState } from 'react'
import { HeroScene, MENU_ITEMS } from '@/components/hero-scene'

export function LandingMenu() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const select = (index: number) => {
    setActiveIndex((prev) => (index < 0 || prev === index ? null : index))
  }

  return (
    <>
      <div className="absolute inset-0">
        <HeroScene activeIndex={activeIndex} onSelect={select} />
      </div>
      <nav aria-label="Main" className="sr-only">
        <ul>
          {MENU_ITEMS.map((label, i) => (
            <li key={label}>
              <button type="button" aria-pressed={activeIndex === i} onClick={() => select(i)}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
