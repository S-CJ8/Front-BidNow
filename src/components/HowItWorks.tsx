import { Gavel, Search, Shield, Trophy } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Explora",
    text: "Busca entre miles de artículos únicos y encuentra lo que buscas.",
    Icon: Search,
  },
  {
    n: "02",
    title: "Oferta",
    text: "Participa en subastas en tiempo real y haz tu mejor oferta.",
    Icon: Gavel,
  },
  {
    n: "03",
    title: "Gana",
    text: "Consigue el artículo al mejor precio y recíbelo en casa.",
    Icon: Trophy,
  },
  {
    n: "04",
    title: "Seguridad",
    text: "Todas las transacciones están protegidas y garantizadas.",
    Icon: Shield,
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-white/10 bg-black py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
            ¿Cómo funciona?
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Simple y Seguro
          </h2>
          <p className="mt-3 text-brand-muted">
            Participa en subastas de manera fácil y segura en solo 4 pasos
          </p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {steps.map((step, index) => (
            <div key={step.n} className="relative flex">
              {index < steps.length - 1 && (
                <div
                  className="absolute left-[calc(50%+2rem)] top-12 hidden h-px w-[calc(100%-4rem)] bg-brand-orange/40 lg:block"
                  aria-hidden
                />
              )}
              <div className="relative flex-1 rounded-2xl bg-brand-card p-8 pt-10">
                <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
                  {step.n}
                </span>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-black/50">
                  <step.Icon
                    className="h-6 w-6 text-brand-orange"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
