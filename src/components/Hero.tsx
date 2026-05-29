import { useEffect, useState } from "react";
import { subastasService, usuariosService } from "../services/apiServices";

export function Hero() {
  const [stats, setStats] = useState<{ subastas: number; usuarios: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [subastas, usuarios] = await Promise.all([
          subastasService.list(),
          usuariosService.list(),
        ]);
        if (!cancelled) {
          setStats({ subastas: subastas.length, usuarios: usuarios.length });
        }
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="inicio" className="border-b border-brand-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:px-8 md:py-24">
        <div className="max-w-xl">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-brand-orange">
            Plataforma de Subastas en Vivo
          </p>
          <h1 className="font-condensed text-5xl font-black uppercase leading-none tracking-tight text-white md:text-6xl lg:text-7xl">
            Tu Proxima
            <br />
            <span className="text-brand-orange">Gran Adquisicion</span>
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-white/50">
            Articulos unicos, coleccionables y tesoros exclusivos. Participa en subastas
            en tiempo real y consigue los mejores precios.
          </p>
          <div className="mt-10 flex gap-3">
            <a
              href="#subastas"
              className="bg-brand-orange px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white"
            >
              Explorar Subastas
            </a>
            <a
              href="#como-funciona"
              className="border border-brand-border px-8 py-3 font-mono text-[11px] uppercase tracking-widest text-white/50"
            >
              Como Funciona
            </a>
          </div>
        </div>

        <div
          className="hidden aspect-video border border-brand-border bg-cover bg-center md:block"
          style={{
            backgroundImage:
              "linear-gradient(to left, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.3) 60%, transparent 100%), url(https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80)",
          }}
        />
      </div>

      <div className="border-t border-brand-border">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-brand-border px-6 md:px-8">
          <div className="px-6 py-8 text-center md:px-10">
            <p className="font-condensed text-4xl font-black text-brand-orange md:text-5xl">
              {stats === null ? "—" : stats.subastas}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
              Subastas en API
            </p>
          </div>
          <div className="px-6 py-8 text-center md:px-10">
            <p className="font-condensed text-4xl font-black text-brand-orange md:text-5xl">
              {stats === null ? "—" : stats.usuarios}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
              Usuarios Registrados
            </p>
          </div>
          <div className="px-6 py-8 text-center md:px-10">
            <p className="font-condensed text-4xl font-black text-brand-orange md:text-5xl">
              API
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
              <a
                href="https://back-bidnow.onrender.com/api/docs/"
                target="_blank"
                rel="noreferrer"
                className="text-brand-orange underline-offset-2 hover:underline"
              >
                Documentacion
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
