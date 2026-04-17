import { Facebook, Instagram, Linkedin, Mail, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer
      id="contacto"
      className="border-t border-white/10 bg-black py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div id="acerca">
            <p className="font-serif text-lg text-brand-orange">¿QUIÉN DA MÁS?</p>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              La plataforma de subastas más confiable de Latinoamérica. Encuentra
              tesoros únicos y participa en subastas emocionantes.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "X" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Linkedin, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand-orange"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Enlaces Rápidos</h3>
            <ul className="mt-4 space-y-3 text-sm text-brand-muted">
              {[
                "Sobre Nosotros",
                "Cómo Funciona",
                "Categorías",
                "Blog",
                "Contacto",
              ].map((link) => (
                <li key={link}>
                  <a href="#" className="transition hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Categorías</h3>
            <ul className="mt-4 space-y-3 text-sm text-brand-muted">
              {[
                "Relojes de Lujo",
                "Vehículos Clásicos",
                "Arte y Pinturas",
                "Coleccionables",
                "Joyería",
              ].map((link) => (
                <li key={link}>
                  <a href="#" className="transition hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Newsletter</h3>
            <p className="mt-4 text-sm text-brand-muted">
              Recibe notificaciones sobre nuevas subastas y ofertas exclusivas.
            </p>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted"
                  aria-hidden
                />
                <input
                  type="email"
                  placeholder="Tu email"
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-brand-orange px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Suscribir
              </button>
            </form>
          </div>
        </div>
        <p className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-brand-muted">
          © {new Date().getFullYear()} ¿QUIÉN DA MÁS? Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
