type HeaderProps = {
  loggedIn?: boolean;
  userName?: string;
  onLoginClick?: () => void;
  onLogout?: () => void;
};

export function Header({
  loggedIn = false,
  userName = "",
  onLoginClick,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-dark">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
        <a href="#inicio" className="font-condensed text-2xl font-black uppercase tracking-widest text-brand-orange">
          BidNow
        </a>

        <nav className="hidden gap-8 md:flex">
          {[
            { label: "Inicio", href: "#inicio" },
            { label: "Subastas", href: "#subastas" },
            { label: "Como Funciona", href: "#como-funciona" },
            { label: "Contacto", href: "#contacto" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[11px] uppercase tracking-widest text-white/40"
            >
              {label}
            </a>
          ))}
        </nav>

        {loggedIn ? (
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-white/40 md:block">
              {userName || "Usuario"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="border border-brand-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/60"
            >
              Salir
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="bg-brand-orange px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white"
          >
            Acceder
          </button>
        )}
      </div>
    </header>
  );
}
