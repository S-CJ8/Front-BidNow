import { Facebook, Instagram, Linkedin, Mail, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-brand-border py-14">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">

          <div id="acerca">
            <p className="font-condensed text-xl font-black uppercase tracking-widest text-brand-orange">
              BidNow
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/40">
              Plataforma de subastas en tiempo real. Encuentra articulos unicos y
              participa en subastas seguras.
            </p>
            <div className="mt-6 flex gap-2">
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
                  className="flex h-8 w-8 items-center justify-center border border-brand-border text-white/30"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
              Plataforma
            </p>
            <ul className="space-y-2.5 text-sm text-white/40">
              <li>
                <a href="https://back-bidnow.onrender.com/api/docs/" target="_blank" rel="noreferrer">
                  API (Swagger)
                </a>
              </li>
              <li>
                <a href="https://back-bidnow.onrender.com/api/schema/" target="_blank" rel="noreferrer">
                  OpenAPI Schema
                </a>
              </li>
              {["Sobre Nosotros", "Como Funciona", "Categorias", "Contacto"].map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
              Categorias
            </p>
            <ul className="space-y-2.5 text-sm text-white/40">
              {["Relojes de Lujo", "Vehiculos Clasicos", "Arte y Pinturas", "Coleccionables", "Joyeria"].map(
                (link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
              Notificaciones
            </p>
            <p className="mb-4 text-sm text-white/40">
              Recibe avisos sobre nuevas subastas y ofertas.
            </p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" aria-hidden />
                <input
                  type="email"
                  placeholder="Tu correo"
                  className="w-full border border-brand-border bg-brand-dark py-2.5 pl-9 pr-3 font-mono text-[11px] text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-brand-orange py-2.5 font-mono text-[11px] uppercase tracking-widest text-white"
              >
                Suscribir
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/20">
            &copy; {new Date().getFullYear()} BidNow — Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
