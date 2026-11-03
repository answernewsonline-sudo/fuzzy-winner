import { ArrowRight } from 'lucide-react'

export function HeroContent() {
  return (
    <div className="mt-auto flex flex-col gap-10 px-6 pb-10 md:flex-row md:items-end md:justify-between md:px-10 md:pb-14">
      <div className="max-w-3xl">
        <p className="mb-4 font-mono text-xs tracking-widest text-[#ff5a1f] uppercase">
          Interactive 3D studio
        </p>
        <h1 className="text-5xl leading-[0.95] font-semibold tracking-tight text-balance md:text-7xl lg:text-8xl">
          Worlds you can touch.
        </h1>
      </div>
      <div className="pointer-events-auto flex max-w-sm flex-col gap-6">
        <p className="leading-relaxed text-pretty text-[#e8e6e3]/70">
          We craft real-time 3D experiences for the web with Three.js. Move your cursor to explore,
          hover the form to wake it up.
        </p>
        <a
          href="#"
          className="group inline-flex w-fit items-center gap-3 rounded-full bg-[#ff5a1f] px-6 py-3 text-sm font-medium text-[#0b0b0f] transition-transform hover:scale-[1.03]"
        >
          Start a project
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
