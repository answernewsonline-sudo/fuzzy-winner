import { HeroScene } from '@/components/hero-scene'
import { SiteHeader } from '@/components/site-header'
import { HeroContent } from '@/components/hero-content'

export default function Page() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0b0b0f] text-[#e8e6e3]">
      <div className="absolute inset-0">
        <HeroScene />
      </div>
      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <SiteHeader />
        <HeroContent />
      </div>
    </main>
  )
}
