import { Gavel, Search, Shield, Trophy } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Explorar",
    text: "Busca entre los articulos disponibles y encuentra lo que necesitas.",
    Icon: Search,
  },
  {
    n: "02",
    title: "Ofertar",
    text: "Participa en subastas en tiempo real y registra tu mejor oferta.",
    Icon: Gavel,
  },
  {
    n: "03",
    title: "Ganar",
    text: "Consigue el articulo al mejor precio con la oferta mas alta.",
    Icon: Trophy,
  },
  {
    n: "04",
    title: "Seguridad",
    text: "Todas las transacciones estan protegidas y garantizadas.",
    Icon: Shield,
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-b border-brand-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12">
          <p className="font-mono text-[11px] uppercase tracking-widest text-brand-orange">
            Proceso
          </p>
          <h2 className="mt-2 font-condensed text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
            Como Funciona
          </h2>
          <p className="mt-3 font-mono text-[11px] text-white/30">
            Participa en subastas en cuatro pasos simples
          </p>
        </div>

        <div className="grid gap-px border border-brand-border bg-brand-border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="bg-brand-dark p-6">
              <div className="mb-6 flex items-start justify-between">
                <div className="border border-brand-border p-2.5">
                  <step.Icon className="h-5 w-5 text-brand-orange" strokeWidth={1.5} aria-hidden />
                </div>
                <span className="font-condensed text-4xl font-black text-white/10">{step.n}</span>
              </div>
              <h3 className="font-condensed text-lg font-black uppercase tracking-widest text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/40">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
