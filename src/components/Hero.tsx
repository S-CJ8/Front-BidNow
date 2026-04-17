import { Play } from "lucide-react";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden border-b border-white/10"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:gap-8 md:px-8 md:py-24 lg:py-28">
        <div className="relative z-10 max-w-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Subastas en vivo
          </p>
          <h1 className="font-sans text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Tu próxima
            <br />
            <span className="text-brand-orange">gran adquisición</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/85 md:text-lg">
            Descubre artículos únicos, coleccionables y tesoros exclusivos.
            Participa en subastas en tiempo real y consigue los mejores
            precios. La emoción de ganar está a un clic de distancia.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#subastas"
              className="inline-flex items-center justify-center rounded-xl bg-brand-orange px-8 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Explorar Subastas
            </a>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-btn-secondary px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-btn-secondary/90"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden />
              Ver Tutorial
            </button>
          </div>
        </div>
        <div className="relative hidden min-h-[320px] md:block md:min-h-[420px]">
          <div
            className="absolute inset-0 rounded-2xl bg-cover bg-center opacity-90"
            style={{
              backgroundImage:
                "linear-gradient(to left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 45%, transparent 70%), url(https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80)",
            }}
          />
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-white/10 px-6 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:gap-4">
          <div>
            <p className="font-sans text-3xl font-bold text-brand-orange md:text-4xl">
              1,234
            </p>
            <p className="mt-1 text-sm text-brand-muted">Subastas Activas</p>
          </div>
          <div>
            <p className="font-sans text-3xl font-bold text-brand-orange md:text-4xl">
              45K+
            </p>
            <p className="mt-1 text-sm text-brand-muted">Usuarios Activos</p>
          </div>
          <div>
            <p className="font-sans text-3xl font-bold text-brand-orange md:text-4xl">
              $2.5M
            </p>
            <p className="mt-1 text-sm text-brand-muted">Vendido este mes</p>
          </div>
        </div>
      </div>
    </section>
  );
}
