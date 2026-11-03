import { LandingMenu } from '@/components/landing-menu'

export default function Page() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0b0b0f] text-[#e8e6e3]">
      <h1 className="sr-only">Landing</h1>
      <LandingMenu />
    </main>
  )
}
