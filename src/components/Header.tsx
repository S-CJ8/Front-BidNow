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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-8">
        <a
          href="#inicio"
          className="font-serif text-lg tracking-wide text-brand-orange md:text-xl"
        >
          ¿QUIÉN DA MÁS?
        </a>
        <nav className="order-last flex w-full basis-full justify-center gap-6 md:order-none md:flex-1 md:w-auto md:basis-auto md:gap-8">
          <a
            href="#inicio"
            className="text-sm font-medium text-brand-orange transition hover:text-brand-orange"
          >
            Inicio
          </a>
          <a
            href="#acerca"
            className="text-sm font-medium text-white/80 transition hover:text-white"
          >
            Acerca de Nosotros
          </a>
          <a
            href="#contacto"
            className="text-sm font-medium text-white/80 transition hover:text-white"
          >
            Contacto
          </a>
        </nav>
        {loggedIn ? (
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-white/80 md:inline">
              Hola, {userName || "Usuario"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="shrink-0 rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
