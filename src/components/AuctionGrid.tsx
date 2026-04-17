import {
  ArrowRight,
  Clock,
  Gavel,
  TrendingUp,
} from "lucide-react";

const categories = [
  "Todas",
  "Relojes",
  "Vehículos",
  "Coleccionables",
  "Arte",
  "Joyería",
];

const auctions = [
  {
    id: 1,
    category: "Relojes",
    title: "Reloj de Lujo Vintage Edición Limitada",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80",
    time: "2h 34m",
    price: "$8.500",
    change: "+70%",
    bids: 23,
    featured: true,
  },
  {
    id: 2,
    category: "Vehículos",
    title: "Automóvil Clásico Restaurado 1965",
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80",
    time: "5h 12m",
    price: "$45.000",
    change: "+50%",
    bids: 47,
    featured: true,
  },
  {
    id: 3,
    category: "Coleccionables",
    title: "Martillo de Subasta Profesional Antiguo",
    image:
      "https://images.unsplash.com/photo-1589829085416-c6548a2a47be?w=600&q=80",
    time: "1d 3h",
    price: "$650",
    change: "+63%",
    bids: 12,
    featured: true,
  },
];

export function AuctionGrid() {
  return (
    <section id="subastas" className="bg-black py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
              Subastas en vivo
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              Ofertas Activas Ahora
            </h2>
          </div>
          <a
            href="#subastas"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange transition hover:brightness-110"
          >
            Ver todas las subastas
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <div className="mb-10 flex flex-wrap gap-2 rounded-full bg-brand-pill p-1.5">
          {categories.map((cat, i) => (
            <button
              key={cat}
              type="button"
              className={
                i === 0
                  ? "rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
                  : "rounded-full px-5 py-2 text-sm font-medium text-white/40 transition hover:text-white/70"
              }
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl bg-brand-card shadow-lg shadow-black/40"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute left-3 top-3 rounded-lg bg-brand-orange px-2.5 py-1 text-xs font-semibold text-white">
                  {item.category}
                </span>
                {item.featured && (
                  <span className="absolute right-3 top-3 rounded-lg bg-gold-badge px-2.5 py-1 text-xs font-semibold text-black">
                    Destacado
                  </span>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5 text-brand-orange" aria-hidden />
                  {item.time}
                </div>
              </div>
              <div className="space-y-4 p-5">
                <h3 className="text-lg font-semibold leading-snug text-white">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">Oferta actual</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-brand-orange">
                      {item.price}
                    </span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                      {item.change}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">Ofertas</span>
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <Gavel className="h-4 w-4 text-brand-orange/90" aria-hidden />
                    {item.bids}
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                >
                  Hacer Oferta
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
