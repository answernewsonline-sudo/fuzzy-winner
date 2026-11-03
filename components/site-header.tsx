const links = ['Work', 'Studio', 'Journal', 'Contact']

export function SiteHeader() {
  return (
    <header className="pointer-events-auto flex items-center justify-between px-6 py-6 md:px-10">
      <a href="#" className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase">
        <span className="size-2.5 rounded-full bg-[#ff5a1f]" aria-hidden="true" />
        Orbit
      </a>
      <nav aria-label="Primary">
        <ul className="hidden items-center gap-8 text-sm text-[#e8e6e3]/70 md:flex">
          {links.map((link) => (
            <li key={link}>
              <a href="#" className="transition-colors hover:text-[#e8e6e3]">
                {link}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a
        href="#"
        className="rounded-full border border-[#e8e6e3]/20 px-4 py-2 text-sm transition-colors hover:bg-[#e8e6e3] hover:text-[#0b0b0f]"
      >
        Get in touch
      </a>
    </header>
  )
}
