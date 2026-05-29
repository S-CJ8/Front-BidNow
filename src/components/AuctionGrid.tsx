import { Clock } from "lucide-react";
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

const categories = ["Todas", "Relojes", "Vehiculos", "Coleccionables", "Arte", "Joyeria"];

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
  const [activeCategory, setActiveCategory] = useState("Todas");

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
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
        bids: bidCount,
      };
    });
  }, [subastas, productos, pujas]);

  return (
    <section id="subastas" className="border-b border-brand-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-brand-orange">
              Subastas en Vivo
            </p>
            <h2 className="mt-2 font-condensed text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
              Ofertas Activas
            </h2>
            <p className="mt-2 font-mono text-[11px] text-white/30">
              Datos en tiempo real desde{" "}
              <a
                href="https://back-bidnow.onrender.com/api/docs/"
                target="_blank"
                rel="noreferrer"
                className="text-brand-orange"
              >
                back-bidnow.onrender.com
              </a>
            </p>
          </div>
          <a href="#subastas" className="font-mono text-[11px] uppercase tracking-widest text-brand-orange">
            Ver Todas &rarr;
          </a>
        </div>

        <div className="mb-8 flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-widest ${
                activeCategory === cat
                  ? "bg-brand-orange text-white"
                  : "border border-brand-border text-white/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <p className="mb-6 font-mono text-[11px] uppercase tracking-widest text-white/30">
            Cargando subastas...
          </p>
        )}
        {error && (
          <p className="mb-6 border border-red-500/30 bg-red-500/5 px-4 py-3 font-mono text-[11px] text-red-300">
            {error}
          </p>
        )}
        {!loading && !error && liveCards.length === 0 && (
          <p className="mb-6 font-mono text-[11px] uppercase tracking-widest text-white/30">
            No hay subastas activas. Publica una desde el panel despues de iniciar sesion.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveCards.map((item) => (
            <article
              key={String(item.id)}
              className="border border-brand-border bg-brand-card"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={item.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute left-0 top-0 bg-brand-orange px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                  {item.category}
                </div>
                <div className="absolute bottom-0 right-0 flex items-center gap-1.5 bg-black/80 px-3 py-1.5">
                  <Clock className="h-3 w-3 text-brand-orange" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white">
                    {item.time}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-semibold leading-snug text-white">{item.title}</h3>
                <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">Oferta Actual</p>
                    <p className="mt-0.5 font-condensed text-xl font-black text-brand-orange">{item.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">Pujas</p>
                    <p className="mt-0.5 font-condensed text-xl font-black text-white">{item.bids}</p>
                  </div>
                </div>
                <a
                  href="#inicio"
                  className="mt-3 block w-full bg-brand-orange py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-white"
                >
                  Inicia Sesion para Pujar
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
