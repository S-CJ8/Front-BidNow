import { ArrowRight, Clock, Gavel, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  currentOfferAmount,
  findProductForSubasta,
  formatCountdownLabel,
  formatCurrency,
  isAuctionLive,
  pickId,
  pickText,
  subastaTitle,
} from "../lib/liveAuctions";
import {
  ApiRecord,
  productosService,
  pujasService,
  subastasService,
} from "../services/apiServices";

const categories = ["Todas", "Relojes", "Vehículos", "Coleccionables", "Arte", "Joyería"];

const fallbackAuctionImages = [
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80",
  "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=600&q=80",
];

export function AuctionGrid() {
  const [subastas, setSubastas] = useState<ApiRecord[]>([]);
  const [productos, setProductos] = useState<ApiRecord[]>([]);
  const [pujas, setPujas] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [s, p, bids] = await Promise.all([
          subastasService.list(),
          productosService.list(),
          pujasService.list(),
        ]);
        if (!cancelled) {
          setSubastas(s);
          setProductos(p);
          setPujas(bids);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "No se pudieron cargar las subastas.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const liveCards = useMemo(() => {
    const live = subastas.filter(isAuctionLive).slice(0, 6);
    return live.map((sub, index) => {
      const offer = currentOfferAmount(sub, productos, pujas);
      const product = findProductForSubasta(sub, productos);
      const image =
        pickText(product ?? sub, ["imagen", "image", "foto"]) ||
        fallbackAuctionImages[index % fallbackAuctionImages.length];
      const bidCount = pujas.filter(
        (b) => String(b.subasta ?? b.subasta_id) === String(pickId(sub)),
      ).length;
      return {
        id: pickId(sub),
        category: pickText(product ?? sub, ["categoria", "category"]) || "General",
        title: subastaTitle(sub, productos),
        image,
        time: formatCountdownLabel(sub),
        price: formatCurrency(offer),
        change: "+0%",
        bids: bidCount,
        featured: index < 3,
      };
    });
  }, [subastas, productos, pujas]);

  return (
    <section id="subastas" className="bg-black py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
              Subastas en vivo
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              Ofertas activas desde el API
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Datos en tiempo real de{" "}
              <a
                href="https://back-bidnow.onrender.com/api/docs/"
                target="_blank"
                rel="noreferrer"
                className="text-brand-orange underline-offset-2 hover:underline"
              >
                back-bidnow.onrender.com
              </a>
            </p>
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

        {loading && (
          <p className="mb-6 text-sm text-white/70">Cargando subastas desde el servidor...</p>
        )}
        {error && (
          <p className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {!loading && !error && liveCards.length === 0 && (
          <p className="mb-6 text-sm text-white/70">
            No hay subastas en curso en este momento. Publica una desde tu panel despues de iniciar
            sesion.
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {liveCards.map((item) => (
            <article
              key={String(item.id)}
              className="overflow-hidden rounded-2xl bg-brand-card shadow-lg shadow-black/40"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={item.image} alt="" className="h-full w-full object-cover" />
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
                <h3 className="text-lg font-semibold leading-snug text-white">{item.title}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">Oferta actual</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-brand-orange">{item.price}</span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                      {item.change}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">Pujas</span>
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <Gavel className="h-4 w-4 text-brand-orange/90" aria-hidden />
                    {item.bids}
                  </span>
                </div>
                <a
                  href="#inicio"
                  className="block w-full rounded-xl bg-brand-orange py-3.5 text-center text-sm font-bold text-white transition hover:brightness-110"
                >
                  Inicia sesion para pujar
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
