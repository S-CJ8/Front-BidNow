import {
  Bell,
  ChartColumnBig,
  Clock3,
  Gavel,
  LayoutDashboard,
  LogOut,
  Map,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Upload,
  User,
} from "lucide-react";
import { ComponentType, ReactNode, useEffect, useMemo, useState } from "react";
import { useApiRequest } from "../hooks/useApiRequest";
import {
  ApiRecord,
  productosService,
  pujasService,
  subastasService,
  transaccionesService,
} from "../services/apiServices";
import { NormalizedUser } from "../services/usersApi";

type DashboardPageProps = {
  user: NormalizedUser;
  onLogout: () => void;
};

type SectionId =
  | "dashboard"
  | "subir"
  | "comprar"
  | "subastas"
  | "perfil"
  | "pedidos"
  | "mapa";

const menuItems: Array<{
  id: SectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subir", label: "Subir Articulo", icon: Upload },
  { id: "comprar", label: "Comprar Articulo", icon: ShoppingCart },
  { id: "subastas", label: "Navegar Subastas", icon: Gavel },
  { id: "perfil", label: "Mi Perfil", icon: User },
  { id: "pedidos", label: "Mis Pedidos", icon: Package },
  { id: "mapa", label: "Mapa de Calor", icon: Map },
];

const fallbackAuctionImages = [
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80",
  "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=900&q=80",
];

function parseDateFromUser(raw: Record<string, unknown>): Date | null {
  const candidates = [
    raw.fecha_registro,
    raw.created_at,
    raw.date_joined,
    raw.createdAt,
    raw.fecha_creacion,
  ];

  for (const value of candidates) {
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [subastas, setSubastas] = useState<ApiRecord[]>([]);
  const [productos, setProductos] = useState<ApiRecord[]>([]);
  const [pujas, setPujas] = useState<ApiRecord[]>([]);
  const [transacciones, setTransacciones] = useState<ApiRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [auctionDurationHours, setAuctionDurationHours] = useState("24");
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | number | null>(
    null,
  );
  const [bidAmountInput, setBidAmountInput] = useState("");
  const [loadState, setLoadState] = useState({ loading: true, error: "" });
  const { loading: mutating, error: actionError, success: actionSuccess, run } =
    useApiRequest();
  const currentUserId = useMemo(() => getCurrentUserId(user), [user]);

  const userMeta = useMemo(() => {
    const joinedAt = parseDateFromUser(user.raw) ?? new Date();
    const ratingRaw = user.raw.calificacion ?? user.raw.rating;
    const rating =
      typeof ratingRaw === "number"
        ? ratingRaw
        : typeof ratingRaw === "string"
          ? Number.parseFloat(ratingRaw)
          : 4.8;

    const daysAsMember = Math.max(
      0,
      Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      rating: Number.isFinite(rating) ? rating.toFixed(1) : "4.8",
      joinedAt,
      daysAsMember,
      isNew: daysAsMember <= 30,
    };
  }, [user.raw]);

  async function loadData() {
    setLoadState({ loading: true, error: "" });
    try {
      const [subastasData, productosData, pujasData, transaccionesData] =
        await Promise.all([
          subastasService.list(),
          productosService.list(),
          pujasService.list(),
          transaccionesService.list(),
        ]);
      setSubastas(subastasData);
      setProductos(productosData);
      setPujas(pujasData);
      setTransacciones(transaccionesData);
      setLoadState({ loading: false, error: "" });
    } catch (error) {
      setLoadState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "No fue posible cargar los datos del dashboard.",
      });
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalInvested = useMemo(() => {
    const sum = transacciones.reduce(
      (acc, item) =>
        acc + pickNumber(item, ["monto", "valor", "total", "amount"]),
      0,
    );
    return formatCurrency(sum);
  }, [transacciones]);

  const liveSubastas = useMemo(
    () => subastas.filter((item) => isAuctionLive(item)),
    [subastas],
  );

  const selectedAuction = useMemo(() => {
    if (liveSubastas.length === 0) {
      return null;
    }
    if (selectedAuctionId === null) {
      return liveSubastas[0];
    }
    return (
      liveSubastas.find((item) => isSameId(pickId(item), selectedAuctionId)) ||
      liveSubastas[0]
    );
  }, [liveSubastas, selectedAuctionId]);

  const selectedAuctionBids = useMemo(() => {
    if (!selectedAuction) {
      return [];
    }
    const auctionId = pickId(selectedAuction);
    return pujas
      .filter((item) =>
        [
          item.subasta,
          item.subasta_id,
          item.id_subasta,
          item.auction,
          item.auction_id,
        ].some((value) => isSameId(value, auctionId)),
      )
      .sort(
        (a, b) =>
          pickNumber(b, ["monto", "valor", "amount"]) -
          pickNumber(a, ["monto", "valor", "amount"]),
      );
  }, [pujas, selectedAuction]);

  const selectedCurrentPrice = useMemo(() => {
    if (!selectedAuction) {
      return 0;
    }
    const fromAuction = pickNumber(selectedAuction, [
      "precio_actual",
      "oferta_actual",
      "precio",
      "valor_actual",
    ]);
    if (fromAuction > 0) {
      return fromAuction;
    }
    return pickNumber(selectedAuctionBids[0] || {}, ["monto", "valor", "amount"]);
  }, [selectedAuction, selectedAuctionBids]);

  const selectedMinBid = useMemo(
    () => Math.max(100, selectedCurrentPrice + 100),
    [selectedCurrentPrice],
  );

  const featuredAuctions = useMemo(
    () =>
      liveSubastas.slice(0, 3).map((item, index) => ({
        id: pickId(item),
        title: pickText(item, ["titulo", "title", "nombre"]) || "Subasta en vivo",
        category: pickText(item, ["categoria", "category"]) || "general",
        price: formatCurrency(
          pickNumber(item, [
            "precio_actual",
            "precio",
            "oferta_actual",
            "valor_actual",
          ]),
        ),
        timeLeft:
          pickText(item, ["tiempo_restante", "duracion", "time_left"]) ||
          "En curso",
        image:
          pickText(item, ["imagen", "image", "foto"]) ||
          fallbackAuctionImages[index % fallbackAuctionImages.length],
      })),
    [liveSubastas],
  );

  const mySubastas = useMemo(
    () =>
      subastas.filter((item) =>
        isAuctionOwnedByCurrentUser(item, user, currentUserId, productos),
      ),
    [subastas, user, currentUserId, productos],
  );

  useEffect(() => {
    if (liveSubastas.length === 0) {
      setSelectedAuctionId(null);
      return;
    }
    if (
      selectedAuctionId === null ||
      !liveSubastas.some((item) => isSameId(pickId(item), selectedAuctionId))
    ) {
      setSelectedAuctionId(pickId(liveSubastas[0]));
    }
  }, [liveSubastas, selectedAuctionId]);

  async function handleCreateProduct() {
    await run(
      async () => {
        if (!newProductTitle.trim()) {
          throw new Error("Ingresa el titulo del articulo.");
        }
        if (currentUserId === null) {
          throw new Error(
            "No se pudo identificar tu usuario para asignarlo como vendedor.",
          );
        }

        const payload: ApiRecord = {
          nombre: newProductTitle.trim(),
          descripcion: newProductDescription.trim(),
        };
        const parsedPrice = Number.parseFloat(newProductPrice);
        if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
          throw new Error("Debes ingresar un precio inicial valido para la subasta.");
        }
        payload.precio_inicial = parsedPrice;

        const productPayloadCandidates: ApiRecord[] = [
          { ...payload, vendedor: currentUserId },
          { ...payload, vendedor_id: currentUserId },
          { ...payload, usuario: currentUserId },
          { ...payload, usuario_id: currentUserId },
          { ...payload, propietario: currentUserId },
        ];

        let createdProduct: ApiRecord | null = null;
        let lastError: Error | null = null;
        for (const candidate of productPayloadCandidates) {
          try {
            const response = await productosService.create(candidate);
            createdProduct = response;
            lastError = null;
            break;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error("Error al crear producto.");
          }
        }

        if (lastError) {
          throw lastError;
        }

        const productId = await resolveCreatedProductId(
          createdProduct,
          currentUserId,
          newProductTitle,
        );
        if (productId === null) {
          throw new Error(
            "Se creo el producto, pero no se pudo obtener su ID para crear la subasta.",
          );
        }

        const now = new Date();
        const durationHours = Math.max(
          1,
          Number.parseInt(auctionDurationHours, 10) || 24,
        );
        const endDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

        const auctionBasePayload: ApiRecord = {
          precio_inicial: parsedPrice,
          fecha_inicio: now.toISOString(),
          fecha_fin: endDate.toISOString(),
          estado: "activa",
        };

        const auctionPayloadCandidates: ApiRecord[] = [
          {
            ...auctionBasePayload,
            producto: productId,
            vendedor: currentUserId,
          },
          {
            ...auctionBasePayload,
            producto_id: productId,
            vendedor_id: currentUserId,
          },
          {
            ...auctionBasePayload,
            id_producto: productId,
            id_usuario: currentUserId,
          },
          {
            ...auctionBasePayload,
            producto: productId,
            usuario: currentUserId,
          },
        ];

        lastError = null;
        for (const candidate of auctionPayloadCandidates) {
          try {
            await subastasService.create(candidate);
            lastError = null;
            break;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error("Error al crear subasta.");
          }
        }
        if (lastError) {
          throw lastError;
        }

        setNewProductTitle("");
        setNewProductDescription("");
        setNewProductPrice("");
        setAuctionDurationHours("24");
        await loadData();
      },
      "Articulo y subasta creados correctamente.",
    );
  }

  async function resolveCreatedProductId(
    createdProduct: ApiRecord | null,
    userId: string | number,
    productTitle: string,
  ): Promise<string | number | null> {
    if (createdProduct) {
      const idFromResponse = pickIdOrNull(createdProduct);
      if (idFromResponse !== null) {
        return idFromResponse;
      }
    }

    const allProducts = await productosService.list();
    const ownerMatches = allProducts.filter((item) =>
      isOwnedByCurrentUser(item, user, userId),
    );
    const byTitle = ownerMatches
      .filter(
        (item) =>
          pickText(item, ["nombre", "title", "titulo"]).trim().toLowerCase() ===
          productTitle.trim().toLowerCase(),
      )
      .sort((a, b) => {
        const aTime = parseDateCandidate(
          a.created_at ?? a.fecha_creacion ?? a.createdAt,
        );
        const bTime = parseDateCandidate(
          b.created_at ?? b.fecha_creacion ?? b.createdAt,
        );
        return (bTime || 0) - (aTime || 0);
      });

    if (byTitle.length > 0) {
      return pickId(byTitle[0]);
    }
    return null;
  }

  async function handleDeletePuja(id: string | number) {
    await run(
      async () => {
        await pujasService.remove(id);
        await loadData();
      },
      "Puja eliminada correctamente.",
    );
  }

  async function handlePlaceBid() {
    if (!selectedAuction) {
      return;
    }
    await run(
      async () => {
        if (currentUserId === null) {
          throw new Error("No se pudo identificar tu usuario para registrar la puja.");
        }
        const amount = Number.parseFloat(bidAmountInput.replace(/[^\d.-]/g, ""));
        if (Number.isNaN(amount) || amount <= 0) {
          throw new Error("Ingresa un valor de oferta valido.");
        }
        if (amount < selectedMinBid) {
          throw new Error(
            `Tu oferta debe ser mayor o igual a ${formatCurrency(selectedMinBid)}.`,
          );
        }

        const auctionId = pickId(selectedAuction);
        const payloadCandidates: ApiRecord[] = [
          { subasta: auctionId, usuario: currentUserId, monto: amount },
          { subasta_id: auctionId, usuario_id: currentUserId, monto: amount },
          { id_subasta: auctionId, id_usuario: currentUserId, valor: amount },
          { auction: auctionId, user: currentUserId, amount },
        ];

        let lastError: Error | null = null;
        for (const payload of payloadCandidates) {
          try {
            await pujasService.create(payload);
            lastError = null;
            break;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error("No se pudo registrar la puja.");
          }
        }
        if (lastError) {
          throw lastError;
        }
        setBidAmountInput("");
        await loadData();
      },
      "Puja registrada correctamente.",
    );
  }

  return (
    <div className="min-h-screen bg-[#13233b] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/95">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-4 md:px-8">
          <p className="shrink-0 font-serif text-lg text-brand-orange md:text-2xl">
            ¿QUIEN DA MAS?
          </p>
          <div className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Buscar subastas, categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-white/15 bg-[#0c111b] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="relative rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 rounded-full bg-brand-orange px-1.5 text-[10px] font-semibold text-white">
              2
            </span>
          </button>
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm">{user.name}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 shrink-0 border-r border-white/10 bg-[#10141e] p-4 md:block">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-lg transition ${
                    isActive
                      ? "bg-brand-orange text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          {(loadState.error || actionError || actionSuccess) && (
            <div className="mb-5 space-y-2 text-sm">
              {loadState.error && (
                <p className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-red-200">
                  {loadState.error}
                </p>
              )}
              {actionError && (
                <p className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-red-200">
                  {actionError}
                </p>
              )}
              {actionSuccess && (
                <p className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-emerald-200">
                  {actionSuccess}
                </p>
              )}
            </div>
          )}

          {activeSection === "dashboard" && (
            <section className="space-y-8">
              <h1 className="text-2xl font-bold">Panel principal</h1>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl bg-[#141822] p-5 shadow-lg shadow-black/30">
                  <TrendingValue
                    value={String(pujas.length)}
                    label="Ofertas activas"
                    accent="text-emerald-400"
                  />
                </article>
                <article className="rounded-2xl bg-[#141822] p-5 shadow-lg shadow-black/30">
                  <TrendingValue
                    value={String(liveSubastas.length)}
                    label="Subastas en vivo"
                    accent="text-blue-400"
                  />
                </article>
                <article className="rounded-2xl bg-[#141822] p-5 shadow-lg shadow-black/30">
                  <TrendingValue
                    value={totalInvested}
                    label="Total invertido"
                    accent="text-yellow-400"
                  />
                </article>
                <article className="rounded-2xl bg-[#141822] p-5 shadow-lg shadow-black/30">
                  <TrendingValue
                    value={String(transacciones.length)}
                    label="Transacciones"
                    accent="text-violet-400"
                  />
                </article>
              </div>

              <div>
                <h2 className="mb-3 text-2xl font-semibold">Subastas en vivo</h2>
                <p className="mb-5 text-white/70">Participa ahora en tiempo real</p>
                <div className="grid gap-5 lg:grid-cols-3">
                  {loadState.loading && (
                    <p className="text-sm text-white/70">Cargando subastas...</p>
                  )}
                  {!loadState.loading && featuredAuctions.length === 0 && (
                    <p className="text-sm text-white/70">
                      No hay subastas en vivo en este momento.
                    </p>
                  )}
                  {featuredAuctions.map((auction) => (
                    <article
                      key={auction.id}
                      className="overflow-hidden rounded-2xl bg-[#121722] shadow-xl shadow-black/40"
                    >
                      <div className="relative h-44">
                        <img
                          src={auction.image}
                          alt={auction.title}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold">
                          {auction.category}
                        </span>
                        <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold">
                          EN VIVO
                        </span>
                      </div>
                      <div className="space-y-3 p-4">
                        <h3 className="line-clamp-2 text-xl font-semibold">{auction.title}</h3>
                        <div className="flex items-center justify-between text-white/80">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4 text-brand-orange" />
                            {auction.timeLeft}
                          </span>
                          <span className="font-semibold text-brand-orange">{auction.price}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAuctionId(auction.id);
                            setActiveSection("comprar");
                          }}
                          className="w-full rounded-xl bg-brand-orange py-3 font-bold transition hover:brightness-110"
                        >
                          Ver Subasta en Vivo
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

            </section>
          )}

          {activeSection === "subir" && (
            <section className="rounded-2xl bg-[#141822] p-8 shadow-xl shadow-black/30">
              <h2 className="text-2xl font-bold">Subir Articulo</h2>
              <p className="mt-2 text-white/75">
                Este formulario crea el producto y tambien su subasta en vivo.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={newProductTitle}
                  onChange={(e) => setNewProductTitle(e.target.value)}
                  placeholder="Titulo del articulo"
                  className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 focus:border-brand-orange focus:outline-none"
                />
                <input
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="Precio inicial"
                  className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 focus:border-brand-orange focus:outline-none"
                />
                <select
                  value={auctionDurationHours}
                  onChange={(e) => setAuctionDurationHours(e.target.value)}
                  className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 focus:border-brand-orange focus:outline-none"
                >
                  <option value="6">Duracion: 6 horas</option>
                  <option value="12">Duracion: 12 horas</option>
                  <option value="24">Duracion: 24 horas</option>
                  <option value="48">Duracion: 48 horas</option>
                  <option value="72">Duracion: 72 horas</option>
                </select>
                <textarea
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  placeholder="Descripcion"
                  className="md:col-span-2 min-h-28 rounded-xl border border-white/15 bg-black/30 px-4 py-3 focus:border-brand-orange focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateProduct}
                disabled={mutating}
                className="mt-5 rounded-xl bg-brand-orange px-6 py-3 font-semibold disabled:opacity-60"
              >
                {mutating ? "Publicando..." : "Publicar producto"}
              </button>
            </section>
          )}

          {activeSection === "comprar" && (
            <section className="space-y-5">
              <h2 className="text-2xl font-bold">Comprar Articulo</h2>
              <p className="text-white/75">
                Selecciona una subasta en vivo para ver detalle y pujar.
              </p>

              <div className="grid gap-3 md:grid-cols-3">
                {liveSubastas.slice(0, 6).map((item, idx) => {
                  const id = pickId(item);
                  const active = selectedAuction && isSameId(pickId(selectedAuction), id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedAuctionId(id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-brand-orange bg-brand-orange/10"
                          : "border-white/10 bg-[#141822] hover:border-white/30"
                      }`}
                    >
                      <p className="font-semibold">
                        {pickText(item, ["titulo", "title", "nombre"]) || `Subasta ${idx + 1}`}
                      </p>
                      <p className="mt-1 text-sm text-brand-orange">
                        {formatCurrency(
                          pickNumber(item, [
                            "precio_actual",
                            "oferta_actual",
                            "precio",
                            "valor_actual",
                          ]),
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!selectedAuction ? (
                <div className="rounded-2xl bg-[#141822] p-6 text-sm text-white/70">
                  No hay subastas en vivo para mostrar en esta sección.
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                  <div className="space-y-5">
                    <article className="overflow-hidden rounded-2xl bg-[#141822] shadow-xl shadow-black/30">
                      <div className="relative h-64 md:h-80">
                        <img
                          src={
                            pickText(selectedAuction, ["imagen", "image", "foto"]) ||
                            fallbackAuctionImages[0]
                          }
                          alt={pickText(selectedAuction, ["titulo", "title", "nombre"]) || "Subasta"}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-4 top-4 rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold">
                          EN VIVO
                        </span>
                      </div>
                    </article>

                    <article className="rounded-2xl bg-[#141822] p-6 shadow-xl shadow-black/30">
                      <h3 className="text-3xl font-semibold">
                        {pickText(selectedAuction, ["titulo", "title", "nombre"]) || "Subasta en vivo"}
                      </h3>
                      <p className="mt-4 text-lg leading-relaxed text-white/85">
                        {pickText(selectedAuction, ["descripcion", "description", "detalle"]) ||
                          "Descripcion no disponible para esta subasta."}
                      </p>
                      <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {pickText(selectedAuction, [
                              "vendedor_nombre",
                              "usuario_nombre",
                              "owner_name",
                            ]) || "Vendedor de la subasta"}
                          </p>
                          <p className="text-sm text-yellow-300">★ 4.9</p>
                        </div>
                      </div>
                    </article>

                    <article className="rounded-2xl bg-[#141822] p-6 shadow-xl shadow-black/30">
                      <h4 className="text-2xl font-semibold">Historial de Ofertas</h4>
                      <div className="mt-4 space-y-3">
                        {selectedAuctionBids.length === 0 && (
                          <p className="text-sm text-white/70">
                            Aun no hay pujas registradas para esta subasta.
                          </p>
                        )}
                        {selectedAuctionBids.slice(0, 6).map((bid) => (
                          <div
                            key={pickId(bid)}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                          >
                            <div>
                              <p className="font-medium">
                                {pickText(bid, [
                                  "usuario_nombre",
                                  "postor_nombre",
                                  "user_name",
                                ]) || "Postor"}
                              </p>
                              <p className="text-xs text-white/60">
                                {pickText(bid, ["hora", "fecha", "created_at"]) || "Reciente"}
                              </p>
                            </div>
                            <p className="font-semibold text-brand-orange">
                              {formatCurrency(
                                pickNumber(bid, ["monto", "valor", "amount"]),
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>

                  <div className="space-y-4">
                    <article className="rounded-2xl bg-[#141822] p-5 shadow-xl shadow-black/30">
                      <p className="inline-flex items-center gap-2 text-lg text-white/90">
                        <Clock3 className="h-5 w-5 text-brand-orange" />
                        Tiempo Restante
                      </p>
                      <p className="mt-4 text-5xl font-semibold tracking-tight">
                        {formatCountdownLabel(selectedAuction)}
                      </p>
                      <div className="mt-4 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-4/5 rounded-full bg-brand-orange" />
                      </div>
                    </article>

                    <article className="rounded-2xl bg-[#141822] p-5 shadow-xl shadow-black/30">
                      <p className="text-white/80">Oferta Actual</p>
                      <p className="mt-3 text-5xl font-semibold">
                        {formatCurrency(selectedCurrentPrice)}
                      </p>
                      <p className="mt-3 text-sm text-emerald-300">+56% desde inicio</p>
                      <p className="mt-2 text-sm text-white/70">
                        {selectedAuctionBids.length} ofertas
                      </p>
                    </article>

                    <article className="rounded-2xl bg-[#141822] p-5 shadow-xl shadow-black/30">
                      <h4 className="text-2xl font-semibold">Hacer Oferta</h4>
                      <label className="mt-4 block text-sm text-white/80">Tu oferta</label>
                      <input
                        value={bidAmountInput}
                        onChange={(e) => setBidAmountInput(e.target.value)}
                        placeholder={`Minimo ${formatCurrency(selectedMinBid)}`}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-lg focus:border-brand-orange focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handlePlaceBid}
                        disabled={mutating}
                        className="mt-4 w-full rounded-xl bg-brand-orange py-3 text-lg font-semibold disabled:opacity-60"
                      >
                        {mutating ? "Enviando..." : "Pujar Ahora"}
                      </button>
                    </article>

                    <article className="rounded-2xl bg-[#141822] p-5 shadow-xl shadow-black/30">
                      <h4 className="text-xl font-semibold">Informacion</h4>
                      <div className="mt-4 space-y-2 text-sm">
                        <p className="flex items-center justify-between">
                          <span className="text-white/70">Precio inicial</span>
                          <span>
                            {formatCurrency(
                              pickNumber(selectedAuction, [
                                "precio_inicial",
                                "precio_base",
                                "precio",
                              ]),
                            )}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-white/70">Total ofertas</span>
                          <span>{selectedAuctionBids.length}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-white/70">Categoria</span>
                          <span>
                            {pickText(selectedAuction, ["categoria", "category"]) || "General"}
                          </span>
                        </p>
                      </div>
                    </article>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "subastas" && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">Navegar Subastas</h2>
              <div className="rounded-2xl bg-[#141822] p-5">
                <p className="mb-3 text-white/75">
                  Subastas disponibles: {subastas.length}
                </p>
                <div className="space-y-3">
                  {subastas.slice(0, 8).map((item) => (
                    <article
                      key={pickId(item)}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {pickText(item, ["titulo", "title", "nombre"]) ||
                            "Subasta"}
                        </p>
                        <p className="text-brand-orange">
                          {formatCurrency(
                            pickNumber(item, [
                              "precio_actual",
                              "precio_inicial",
                              "precio",
                            ]),
                          )}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#141822] p-5">
                <p className="mb-3 text-white/75">Pujas recientes (con eliminar)</p>
                <div className="space-y-3">
                  {pujas.slice(0, 8).map((item) => {
                    const id = pickId(item);
                    return (
                      <article
                        key={id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div>
                          <p className="font-semibold">Puja #{String(id)}</p>
                          <p className="text-sm text-white/70">
                            {formatCurrency(
                              pickNumber(item, ["monto", "valor", "amount"]),
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePuja(id)}
                          disabled={mutating}
                          className="rounded-lg border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-60"
                        >
                          Eliminar
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {activeSection === "perfil" && (
            <section className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <p className="mt-2 text-white/70">
                  Informacion de tu cuenta y reputacion dentro de la plataforma.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <article className="rounded-2xl bg-[#141822] p-6 shadow-xl shadow-black/30 lg:col-span-1">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/90">
                      <User className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold">{user.name}</p>
                      <p className="text-sm text-white/70">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="flex items-center justify-between">
                      <span className="text-white/70">Calificacion</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-yellow-300">
                        <Star className="h-4 w-4" /> {userMeta.rating}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-white/70">Estado</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          userMeta.isNew
                            ? "bg-amber-500/20 text-amber-200"
                            : "bg-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {userMeta.isNew ? "Usuario nuevo" : "Usuario activo"}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-white/70">Miembro hace</span>
                      <span>{userMeta.daysAsMember} dias</span>
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl bg-[#141822] p-6 shadow-xl shadow-black/30 lg:col-span-2">
                  <h2 className="mb-4 text-xl font-semibold">Datos personales</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ProfileField label="Nombre completo" value={user.name} />
                    <ProfileField label="Correo electronico" value={user.email} />
                    <ProfileField
                      label="ID de usuario"
                      value={String(user.id ?? "Sin asignar")}
                    />
                    <ProfileField
                      label="Fecha de registro"
                      value={formatDate(userMeta.joinedAt)}
                    />
                    <ProfileField
                      label="Ultimo acceso"
                      value={formatDate(new Date())}
                    />
                    <ProfileField
                      label="Seguridad"
                      value="Cuenta protegida"
                      icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
                    />
                  </div>
                </article>
              </div>

              <article className="rounded-2xl bg-[#141822] p-6 shadow-xl shadow-black/30">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Mis Subastas</h2>
                  <span className="rounded-full bg-brand-orange/20 px-3 py-1 text-xs font-semibold text-brand-orange">
                    {mySubastas.length} publicadas
                  </span>
                </div>

                {mySubastas.length === 0 ? (
                  <p className="text-sm text-white/70">
                    Aun no tienes subastas publicadas. Puedes crear una desde
                    la opcion "Subir Articulo".
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mySubastas.slice(0, 8).map((item) => (
                      <article
                        key={pickId(item)}
                        className="rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">
                            {pickText(item, ["titulo", "title", "nombre"]) ||
                              "Subasta"}
                          </p>
                          <p className="text-brand-orange">
                            {formatCurrency(
                              pickNumber(item, [
                                "precio_actual",
                                "precio_inicial",
                                "precio",
                              ]),
                            )}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-white/70">
                          Estado:{" "}
                          {pickText(item, ["estado", "status", "estado_subasta"]) ||
                            "Sin estado"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </section>
          )}

          {activeSection === "pedidos" && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">Mis Pedidos</h2>
              <p className="text-white/75">
                Mostrando transacciones desde `/api/transacciones/`.
              </p>
              <div className="space-y-3">
                {transacciones.slice(0, 10).map((item) => (
                  <article
                    key={pickId(item)}
                    className="rounded-xl border border-white/10 bg-[#141822] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        Transaccion #{String(pickId(item))}
                      </p>
                      <p className="text-brand-orange">
                        {formatCurrency(
                          pickNumber(item, ["monto", "total", "amount", "valor"]),
                        )}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      Estado:{" "}
                      {pickText(item, ["estado", "status"]) || "Sin estado reportado"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeSection === "mapa" && (
            <section className="rounded-2xl bg-[#141822] p-8 shadow-xl shadow-black/30">
              <h2 className="text-2xl font-bold">Mapa de Calor</h2>
              <p className="mt-2 text-white/75">
                Vista analitica basada en transacciones actuales.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Transacciones"
                  value={String(transacciones.length)}
                />
                <MetricCard label="Pujas" value={String(pujas.length)} />
                <MetricCard label="Productos" value={String(productos.length)} />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function pickText(item: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function pickNumber(item: ApiRecord, keys: string[]): number {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

function pickId(item: ApiRecord): string | number {
  const value = item.id ?? item.id_subasta ?? item.id_producto ?? item.id_puja;
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }
  return Math.random().toString(36).slice(2);
}

function pickIdOrNull(item: ApiRecord): string | number | null {
  const value = item.id ?? item.id_subasta ?? item.id_producto ?? item.id_puja;
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }
  return null;
}

function isSameId(left: unknown, right: unknown): boolean {
  if (left === null || left === undefined || right === null || right === undefined) {
    return false;
  }
  return String(left).trim() === String(right).trim();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCountdownLabel(item: ApiRecord): string {
  const endTimestamp = parseDateCandidate(
    item.fecha_fin ?? item.finaliza_en ?? item.end_date ?? item.end_at,
  );
  if (!endTimestamp) {
    return pickText(item, ["tiempo_restante", "duracion", "time_left"]) || "En curso";
  }
  const diffMs = Math.max(0, endTimestamp - Date.now());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getCurrentUserId(user: NormalizedUser): number | string | null {
  const candidates = [
    user.id,
    user.raw.id,
    user.raw.id_usuario,
    user.raw.usuario_id,
    user.raw.pk,
  ];
  for (const value of candidates) {
    if (typeof value === "number" || typeof value === "string") {
      const text = String(value).trim();
      if (text) {
        return value;
      }
    }
  }
  return null;
}

function isOwnedByCurrentUser(
  item: ApiRecord,
  user: NormalizedUser,
  currentUserId: number | string | null,
): boolean {
  const ownerIdCandidates = [
    item.vendedor,
    item.vendedor_id,
    item.usuario,
    item.usuario_id,
    item.propietario,
    item.creado_por,
    item.user,
    item.owner,
  ];

  if (currentUserId !== null) {
    const currentId = String(currentUserId).trim();
    if (
      ownerIdCandidates.some(
        (value) =>
          (typeof value === "string" || typeof value === "number") &&
          String(value).trim() === currentId,
      )
    ) {
      return true;
    }
  }

  const ownerText = [
    pickText(item, ["vendedor_nombre", "usuario_nombre", "owner_name", "autor"]),
    pickText(item, ["email_vendedor", "usuario_email", "owner_email"]),
  ]
    .join(" ")
    .toLowerCase();

  const userName = user.name.trim().toLowerCase();
  const userEmail = user.email.trim().toLowerCase();

  return Boolean(
    ownerText &&
      ((userName && ownerText.includes(userName)) ||
        (userEmail && ownerText.includes(userEmail))),
  );
}

function isAuctionOwnedByCurrentUser(
  auction: ApiRecord,
  user: NormalizedUser,
  currentUserId: number | string | null,
  productos: ApiRecord[],
): boolean {
  // 1) Si la subasta ya trae vendedor/usuario directo.
  if (isOwnedByCurrentUser(auction, user, currentUserId)) {
    return true;
  }

  // 2) Si la subasta referencia producto, lo resolvemos contra productos del usuario.
  const ownedProductIds = new Set(
    productos
      .filter((product) => isOwnedByCurrentUser(product, user, currentUserId))
      .map((product) => String(pickId(product))),
  );

  const productLinkCandidates = [
    auction.producto,
    auction.producto_id,
    auction.id_producto,
    auction.product,
    auction.product_id,
  ];

  for (const value of productLinkCandidates) {
    if (typeof value === "number" || typeof value === "string") {
      if (ownedProductIds.has(String(value))) {
        return true;
      }
    }
  }

  // 3) Si viene objeto embebido de producto dentro de la subasta.
  const embeddedProductCandidates = [auction.producto, auction.product];
  for (const candidate of embeddedProductCandidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      const embedded = candidate as ApiRecord;
      if (
        ownedProductIds.has(String(pickId(embedded))) ||
        isOwnedByCurrentUser(embedded, user, currentUserId)
      ) {
        return true;
      }
    }
  }

  return false;
}

function isAuctionLive(item: ApiRecord): boolean {
  const booleanFlags = [
    item.en_vivo,
    item.is_live,
    item.activa,
    item.activo,
    item.live,
  ];
  if (booleanFlags.some((value) => value === true)) {
    return true;
  }

  const status = pickText(item, ["estado", "status", "estado_subasta"]).toLowerCase();
  if (
    ["en vivo", "activa", "activo", "live", "open", "abierta"].includes(status)
  ) {
    return true;
  }

  const now = Date.now();
  const startCandidate = parseDateCandidate(
    item.fecha_inicio ?? item.inicia_en ?? item.start_date ?? item.start_at,
  );
  const endCandidate = parseDateCandidate(
    item.fecha_fin ?? item.finaliza_en ?? item.end_date ?? item.end_at,
  );
  if (startCandidate && endCandidate) {
    return startCandidate <= now && now <= endCandidate;
  }

  return false;
}

function parseDateCandidate(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function TrendingValue({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="space-y-2">
      <ChartColumnBig className={`h-5 w-5 ${accent}`} />
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-white/75">{label}</p>
    </div>
  );
}

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="mb-1 text-sm text-white/65">{label}</p>
      <p className="inline-flex items-center gap-2 text-base font-medium">
        {icon}
        {value}
      </p>
    </div>
  );
}
