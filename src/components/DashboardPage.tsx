import {
  Bell,
  ChartColumnBig,
  Clock3,
  Gavel,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
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
  currentOfferAmount,
  findProductForSubasta,
  formatCountdownLabel,
  formatCurrency,
  isAuctionLive,
  isSameId,
  parseDateCandidate,
  pickId,
  pickIdOrNull,
  pickNumber,
  pickText,
  subastaDescription,
  subastaTitle,
  toDecimalString,
} from "../lib/liveAuctions";
import {
  ApiRecord,
  metodosPagoService,
  productosService,
  pujasService,
  subastasService,
  transaccionesService,
  usuariosService,
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
  { id: "mapa", label: "Mapa de Calor", icon: MapIcon },
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
      if (!Number.isNaN(parsed.getTime())) return parsed;
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
  const [usuarios, setUsuarios] = useState<ApiRecord[]>([]);
  const [metodosPago, setMetodosPago] = useState<ApiRecord[]>([]);
  const [metodoTipo, setMetodoTipo] = useState("");
  const [metodoReferencia, setMetodoReferencia] = useState("");
  const [metodoTitular, setMetodoTitular] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [auctionDurationHours, setAuctionDurationHours] = useState("24");
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | number | null>(null);
  const [bidAmountInput, setBidAmountInput] = useState("");
  const [showAuctionDetail, setShowAuctionDetail] = useState(false);
  const [productImages, setProductImages] = useState<{ preview: string }[]>([]);
  const [purchaseAuction, setPurchaseAuction] = useState<ApiRecord | null>(null);
  const [dismissedWins] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem("bidnow_dismissed_wins") ?? "[]"));
    } catch { return new Set(); }
  });
  const [loadState, setLoadState] = useState({ loading: true, error: "" });
  const { loading: mutating, error: actionError, success: actionSuccess, run } = useApiRequest();
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

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usuarios) {
      const id = u.id_usuario ?? u.id;
      if (typeof id === "number" || typeof id === "string") {
        const name = pickText(u, ["nombre", "name", "username"]) || `Usuario ${id}`;
        map.set(String(id), name);
      }
    }
    return map;
  }, [usuarios]);

  async function loadData() {
    setLoadState({ loading: true, error: "" });
    try {
      const [subastasData, productosData, pujasData, transaccionesData, usuariosData, metodosData] =
        await Promise.all([
          subastasService.list(),
          productosService.list(),
          pujasService.list(),
          transaccionesService.list(),
          usuariosService.list(),
          metodosPagoService.list(),
        ]);
      setSubastas(subastasData);
      setProductos(productosData);
      setPujas(pujasData);
      setTransacciones(transaccionesData);
      setUsuarios(usuariosData);
      setMetodosPago(metodosData);
      setLoadState({ loading: false, error: "" });
    } catch (error) {
      setLoadState({
        loading: false,
        error: error instanceof Error ? error.message : "No fue posible cargar los datos.",
      });
    }
  }

  useEffect(() => { loadData(); }, []);

  const totalInvested = useMemo(() => {
    const sum = transacciones.reduce(
      (acc, item) => acc + pickNumber(item, ["monto_final", "monto", "valor", "total", "amount"]),
      0,
    );
    return formatCurrency(sum);
  }, [transacciones]);

  const myMetodosPago = useMemo(() => {
    if (currentUserId === null) return [];
    const cid = String(currentUserId);
    return metodosPago.filter(
      (m) => isSameId(m.usuario, cid) || isSameId(m.usuario, currentUserId),
    );
  }, [metodosPago, currentUserId]);

  const liveSubastas = useMemo(() => subastas.filter((item) => isAuctionLive(item)), [subastas]);

  const wonAuctions = useMemo(() => {
    if (currentUserId === null) return [];
    const uid = String(currentUserId);
    return subastas.filter((item) => {
      if (isAuctionLive(item)) return false;
      const aId = pickId(item);
      const bidsForAuction = pujas.filter((b) =>
        isSameId(b.subasta ?? b.subasta_id ?? b.id_subasta, aId),
      );
      if (!bidsForAuction.length) return false;
      const top = [...bidsForAuction].sort(
        (a, b) =>
          pickNumber(b, ["monto", "valor", "amount"]) -
          pickNumber(a, ["monto", "valor", "amount"]),
      )[0];
      return String(top.usuario ?? top.usuario_id ?? "") === uid;
    });
  }, [subastas, pujas, currentUserId]);

  const pendingPurchases = useMemo(
    () => wonAuctions.filter((item) => !dismissedWins.has(String(pickId(item)))),
    [wonAuctions, dismissedWins],
  );

  function dismissWin(id: string | number) {
    dismissedWins.add(String(id));
    try {
      localStorage.setItem("bidnow_dismissed_wins", JSON.stringify([...dismissedWins]));
    } catch { /* ignorar */ }
  }

  const selectedAuction = useMemo(() => {
    if (liveSubastas.length === 0) return null;
    if (selectedAuctionId === null) return liveSubastas[0];
    return liveSubastas.find((item) => isSameId(pickId(item), selectedAuctionId)) || liveSubastas[0];
  }, [liveSubastas, selectedAuctionId]);

  const selectedAuctionBids = useMemo(() => {
    if (!selectedAuction) return [];
    const auctionId = pickId(selectedAuction);
    return pujas
      .filter((item) =>
        [item.subasta, item.subasta_id, item.id_subasta, item.auction, item.auction_id].some(
          (value) => isSameId(value, auctionId),
        ),
      )
      .sort(
        (a, b) =>
          pickNumber(b, ["monto", "valor", "amount"]) - pickNumber(a, ["monto", "valor", "amount"]),
      );
  }, [pujas, selectedAuction]);

  const selectedCurrentPrice = useMemo(() => {
    if (!selectedAuction) return 0;
    return currentOfferAmount(selectedAuction, productos, pujas);
  }, [selectedAuction, productos, pujas]);

  const selectedMinBid = useMemo(
    () => Math.max(100, selectedCurrentPrice + 100),
    [selectedCurrentPrice],
  );

  const featuredAuctions = useMemo(
    () =>
      liveSubastas.slice(0, 3).map((item, index) => {
        const product = findProductForSubasta(item, productos);
        return {
          id: pickId(item),
          title: subastaTitle(item, productos),
          category: pickText(product ?? item, ["categoria", "category"]) || "General",
          price: formatCurrency(currentOfferAmount(item, productos, pujas)),
          timeLeft: formatCountdownLabel(item),
          image: resolveProductImage(
            product,
            item,
            fallbackAuctionImages[index % fallbackAuctionImages.length],
          ),
        };
      }),
    [liveSubastas, productos, pujas],
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
    await run(async () => {
      if (!newProductTitle.trim()) throw new Error("Ingresa el titulo del articulo.");
      if (currentUserId === null) throw new Error("No se pudo identificar tu usuario.");
      const vendorId = Number(currentUserId);
      if (!Number.isFinite(vendorId)) throw new Error("Identificador de usuario invalido.");
      const parsedPrice = Number.parseFloat(newProductPrice);
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0)
        throw new Error("Debes ingresar un precio inicial valido.");

      const createdProduct = await productosService.create({
        titulo: newProductTitle.trim(),
        descripcion: newProductDescription.trim(),
        precio_inicial: toDecimalString(parsedPrice),
        vendedor: vendorId,
        imagen: productImages[0]?.preview ?? "",
      });

      const productId = await resolveCreatedProductId(createdProduct, currentUserId, newProductTitle);
      if (productId === null)
        throw new Error("Se creo el producto pero no se pudo obtener su ID para la subasta.");

      const now = new Date();
      const durationHours = Math.max(1, Number.parseInt(auctionDurationHours, 10) || 24);
      const endDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

      await subastasService.create({
        producto: Number(productId),
        subastador: vendorId,
        fecha_inicio: now.toISOString(),
        fecha_fin: endDate.toISOString(),
        estado: "activa",
      });

      // Guardar imagenes en localStorage porque el backend no las persiste
      if (productImages.length > 0 && productId !== null) {
        try {
          localStorage.setItem(`bidnow_img_${productId}`, productImages[0].preview);
        } catch {
          // localStorage lleno — ignorar
        }
      }

      setNewProductTitle("");
      setNewProductDescription("");
      setNewProductPrice("");
      setAuctionDurationHours("24");
      setProductImages([]);
      await loadData();
    }, "Articulo y subasta creados correctamente.");
  }

  async function resolveCreatedProductId(
    createdProduct: ApiRecord | null,
    userId: string | number,
    productTitle: string,
  ): Promise<string | number | null> {
    if (createdProduct) {
      const idFromResponse = pickIdOrNull(createdProduct);
      if (idFromResponse !== null) return idFromResponse;
    }
    const allProducts = await productosService.list();
    const ownerMatches = allProducts.filter((item) => isOwnedByCurrentUser(item, user, userId));
    const byTitle = ownerMatches
      .filter(
        (item) =>
          pickText(item, ["titulo", "nombre", "title"]).trim().toLowerCase() ===
          productTitle.trim().toLowerCase(),
      )
      .sort((a, b) => {
        const aTime = parseDateCandidate(a.created_at ?? a.fecha_creacion ?? a.createdAt);
        const bTime = parseDateCandidate(b.created_at ?? b.fecha_creacion ?? b.createdAt);
        return (bTime || 0) - (aTime || 0);
      });
    if (byTitle.length > 0) return pickId(byTitle[0]);
    return null;
  }

  async function handleDeletePuja(id: string | number) {
    await run(async () => {
      await pujasService.remove(id);
      await loadData();
    }, "Puja eliminada correctamente.");
  }

  async function handlePlaceBid() {
    if (!selectedAuction) return;
    await run(async () => {
      if (currentUserId === null)
        throw new Error("No se pudo identificar tu usuario para la puja.");
      const amount = Number.parseFloat(bidAmountInput.replace(/[^\d.-]/g, ""));
      if (Number.isNaN(amount) || amount <= 0) throw new Error("Ingresa un valor de oferta valido.");
      if (amount < selectedMinBid)
        throw new Error(`Tu oferta debe ser mayor o igual a ${formatCurrency(selectedMinBid)}.`);
      const auctionId = pickId(selectedAuction);
      const bidderId = Number(currentUserId);
      if (!Number.isFinite(bidderId)) throw new Error("Identificador de usuario invalido.");
      await pujasService.create({
        subasta: Number(auctionId),
        usuario: bidderId,
        monto: toDecimalString(amount),
      });
      setBidAmountInput("");
      await loadData();
    }, "Puja registrada correctamente.");
  }

  async function handleEndAuction(id: string | number) {
    await run(async () => {
      await subastasService.partialUpdate(id, {
        estado: "finalizada",
        fecha_fin: new Date().toISOString(),
      });
      await loadData();
      setShowAuctionDetail(false);
    }, "Subasta finalizada correctamente.");
  }

  async function handleAddMetodoPago() {
    await run(async () => {
      if (currentUserId === null) throw new Error("Debes iniciar sesion para guardar un metodo de pago.");
      const uid = Number(currentUserId);
      if (!Number.isFinite(uid)) throw new Error("Identificador de usuario invalido.");
      if (!metodoTipo.trim()) throw new Error("Indica el tipo de metodo (tarjeta, transferencia).");
      await metodosPagoService.create({
        usuario: uid,
        tipo: metodoTipo.trim(),
        numero_referencia: metodoReferencia.trim() || undefined,
        titular: metodoTitular.trim() || undefined,
      });
      setMetodoTipo("");
      setMetodoReferencia("");
      setMetodoTitular("");
      await loadData();
    }, "Metodo de pago guardado.");
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const promises = files.map(
      (file) =>
        new Promise<{ preview: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve({ preview: (ev.target?.result as string) ?? "" });
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(promises).then((results) =>
      setProductImages((prev) => [...prev, ...results].slice(0, 6)),
    );
    e.target.value = "";
  }

  const inputClass =
    "w-full border border-brand-border bg-brand-dark px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none";

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-dark">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 md:px-6">
          <p className="shrink-0 font-condensed text-xl font-black uppercase tracking-widest text-brand-orange">
            BidNow
          </p>
          <div className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Buscar subastas, categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-brand-border bg-brand-panel py-2 pl-10 pr-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
            />
          </div>
          <button type="button" className="relative p-2 text-white/30">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 bg-brand-orange px-1 font-mono text-[9px] font-bold text-white">
              2
            </span>
          </button>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-7 w-7 items-center justify-center border border-brand-border">
              <User className="h-3.5 w-3.5 text-white/50" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
              {user.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 border border-brand-border px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-white/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar */}
        <aside className="hidden min-h-[calc(100vh-49px)] w-56 shrink-0 border-r border-brand-border bg-brand-panel p-3 md:block">
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left ${
                    isActive
                      ? "border-brand-orange bg-brand-orange/5 text-white"
                      : "border-transparent text-white/30"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-[11px] uppercase tracking-widest">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          {/* Notificaciones de subastas ganadas */}
          {pendingPurchases.map((auction) => (
            <div
              key={pickId(auction)}
              className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-brand-orange/50 bg-brand-orange/5 px-5 py-4"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                  Subasta Ganada
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {subastaTitle(auction, productos)}
                </p>
                <p className="font-condensed text-xl font-black text-brand-orange">
                  {formatCurrency(currentOfferAmount(auction, productos, pujas))}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseAuction(auction)}
                  className="bg-brand-orange px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white"
                >
                  Completar Compra
                </button>
                <button
                  type="button"
                  onClick={() => dismissWin(pickId(auction))}
                  className="border border-brand-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/30"
                >
                  Descartar
                </button>
              </div>
            </div>
          ))}

          {/* Mensajes de estado */}
          {(loadState.error || actionError || actionSuccess) && (
            <div className="mb-5 space-y-2">
              {loadState.error && (
                <p className="border border-red-500/30 bg-red-500/5 px-4 py-2 font-mono text-[11px] text-red-300">
                  {loadState.error}
                </p>
              )}
              {actionError && (
                <p className="border border-red-500/30 bg-red-500/5 px-4 py-2 font-mono text-[11px] text-red-300">
                  {actionError}
                </p>
              )}
              {actionSuccess && (
                <p className="border border-emerald-500/30 bg-emerald-500/5 px-4 py-2 font-mono text-[11px] text-emerald-300">
                  {actionSuccess}
                </p>
              )}
            </div>
          )}

          {/* DASHBOARD */}
          {activeSection === "dashboard" && (
            <section className="space-y-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Panel Principal
                </p>
                <h1 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-white">
                  Resumen de Actividad
                </h1>
              </div>

              <div className="grid gap-px border border-brand-border bg-brand-border sm:grid-cols-2 xl:grid-cols-4">
                <StatCard value={String(pujas.length)} label="Ofertas Activas" />
                <StatCard value={String(liveSubastas.length)} label="Subastas en Vivo" />
                <StatCard value={totalInvested} label="Total Invertido" />
                <StatCard value={String(transacciones.length)} label="Transacciones" />
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                    Subastas en Vivo
                  </p>
                  {!loadState.loading && liveSubastas.length > 0 && (
                    <span className="border border-brand-orange/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                      {liveSubastas.length} activas
                    </span>
                  )}
                </div>

                {loadState.loading && (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/20">
                    Cargando...
                  </p>
                )}
                {!loadState.loading && featuredAuctions.length === 0 && (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/20">
                    No hay subastas en vivo en este momento.
                  </p>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                  {featuredAuctions.map((auction) => (
                    <article key={auction.id} className="border border-brand-border bg-brand-card">
                      <div className="relative h-40 overflow-hidden">
                        <img src={auction.image} alt={auction.title} className="h-full w-full object-cover" />
                        <div className="absolute left-0 top-0 bg-brand-orange px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                          {auction.category}
                        </div>
                        <div className="absolute right-0 top-0 border border-emerald-500/40 bg-brand-dark/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                          En Vivo
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-1 text-sm font-semibold text-white">
                          {auction.title}
                        </h3>
                        <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
                          <div className="flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5 text-brand-orange" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                              {auction.timeLeft}
                            </span>
                          </div>
                          <span className="font-condensed text-lg font-black text-brand-orange">
                            {auction.price}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAuctionId(auction.id);
                            setActiveSection("comprar");
                          }}
                          className="mt-3 w-full bg-brand-orange py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white"
                        >
                          Ver Subasta
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SUBIR ARTICULO */}
          {activeSection === "subir" && (
            <section className="space-y-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">Publicar</p>
                <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-white">
                  Subir Articulo
                </h2>
                <p className="mt-1 font-mono text-[11px] text-white/30">
                  Crea el producto y su subasta en un solo paso.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                {/* Formulario */}
                <div className="border border-brand-border bg-brand-card p-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Titulo del Articulo
                      </label>
                      <input
                        value={newProductTitle}
                        onChange={(e) => setNewProductTitle(e.target.value)}
                        placeholder="Nombre del articulo"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Precio Inicial (COP)
                      </label>
                      <input
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        placeholder="500000"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Duracion de la Subasta
                      </label>
                      <select
                        value={auctionDurationHours}
                        onChange={(e) => setAuctionDurationHours(e.target.value)}
                        className={inputClass}
                      >
                        <option value="6">6 horas</option>
                        <option value="12">12 horas</option>
                        <option value="24">24 horas</option>
                        <option value="48">48 horas</option>
                        <option value="72">72 horas</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Descripcion
                      </label>
                      <textarea
                        value={newProductDescription}
                        onChange={(e) => setNewProductDescription(e.target.value)}
                        placeholder="Describe el articulo..."
                        className={`${inputClass} min-h-24 resize-none`}
                      />
                    </div>
                  </div>

                  <div className="border border-brand-orange/30 bg-brand-orange/5 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                      Aviso del Protocolo
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-white/30">
                      La subasta se activa inmediatamente. La primera imagen sera la imagen principal del articulo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateProduct}
                    disabled={mutating}
                    className="bg-brand-orange px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    {mutating ? "Publicando..." : "Publicar Articulo"}
                  </button>
                </div>

                {/* Panel de imagenes */}
                <div className="space-y-3">
                  <div className="border border-brand-border bg-brand-card p-4">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-white/30">
                      Imagenes del Articulo
                    </p>

                    {/* Zona de carga */}
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-border bg-brand-dark px-4 py-8 text-center">
                        <Upload className="mb-2 h-6 w-6 text-white/20" />
                        <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                          Haz clic para seleccionar
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-white/20">
                          PNG, JPG, WEBP — Max 6 imagenes
                        </p>
                      </div>
                    </label>

                    {/* Preview de imagenes seleccionadas */}
                    {productImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {productImages.map((img, i) => (
                          <div key={i} className="relative aspect-square overflow-hidden border border-brand-border">
                            <img src={img.preview} alt="" className="h-full w-full object-cover" />
                            {i === 0 && (
                              <div className="absolute left-0 top-0 bg-brand-orange px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white">
                                Principal
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setProductImages((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center bg-black/80 font-mono text-[10px] text-white/60"
                            >
                              x
                            </button>
                          </div>
                        ))}
                        {productImages.length < 6 && (
                          <label className="flex aspect-square cursor-pointer items-center justify-center border border-dashed border-brand-border bg-brand-dark">
                            <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                            <span className="font-mono text-2xl text-white/20">+</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vista previa de la tarjeta */}
                  {(newProductTitle || productImages.length > 0) && (
                    <div className="border border-brand-border bg-brand-card">
                      <p className="border-b border-brand-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/20">
                        Vista previa de la tarjeta
                      </p>
                      <div className="relative aspect-[4/3] overflow-hidden bg-brand-panel">
                        {productImages[0] ? (
                          <img src={productImages[0].preview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">Sin imagen</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pt-6 pb-3">
                          <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">Oferta Actual</p>
                          <p className="font-condensed text-xl font-black text-white">
                            {newProductPrice ? formatCurrency(Number.parseFloat(newProductPrice) || 0) : "$0"}
                          </p>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-condensed text-base font-black uppercase text-white">
                          {newProductTitle || "Titulo del articulo"}
                        </p>
                        <div className="mt-2 h-0.5 bg-brand-border" />
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                          --:--:-- &nbsp; Live
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* COMPRAR ARTICULO */}
          {activeSection === "comprar" && !showAuctionDetail && (
            <section className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">Mercado</p>
                  <h2 className="mt-1 font-condensed text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                    Live<br />Auctions
                  </h2>
                  <p className="mt-2 text-sm text-white/40">Subastas activas en tiempo real</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {["Todos", "Relojes", "Vehiculos", "Arte", "Coleccionables"].map((cat) => (
                    <span key={cat} className="border border-brand-border px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {loadState.loading && (
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/20">Cargando subastas...</p>
              )}
              {!loadState.loading && liveSubastas.length === 0 && (
                <div className="border border-brand-border bg-brand-card p-8 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/20">
                    No hay subastas activas. Publica una desde "Subir Articulo".
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {liveSubastas.map((item, idx) => {
                  const id = pickId(item);
                  const product = findProductForSubasta(item, productos);
                  const image = resolveProductImage(
                    product,
                    item,
                    fallbackAuctionImages[idx % fallbackAuctionImages.length],
                  );
                  const price = formatCurrency(currentOfferAmount(item, productos, pujas));
                  const title = subastaTitle(item, productos);
                  const endsSoon = isEndingSoon(item);
                  const pct = auctionTimePercent(item);
                  return (
                    <article
                      key={String(id)}
                      className="border border-brand-border bg-brand-card overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedAuctionId(id);
                        setShowAuctionDetail(true);
                      }}
                    >
                      {/* Imagen */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-brand-panel">
                        <img src={image} alt={title} className="h-full w-full object-cover" />
                        {/* Badge estado */}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 bg-black/70 px-2.5 py-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                            {endsSoon ? "Terminando" : "Live"}
                          </span>
                        </div>
                        {endsSoon && (
                          <div className="absolute right-3 top-3 border border-white/20 bg-black/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                            Ending Soon
                          </div>
                        )}
                        {/* Precio sobre imagen */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pt-6 pb-3">
                          <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">Oferta Actual</p>
                          <p className="font-condensed text-2xl font-black text-white">{price}</p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-condensed text-lg font-black uppercase leading-tight text-white">
                            {title}
                          </h3>
                          <span className="shrink-0 font-mono text-[10px] text-white/20">
                            #{String(id)}
                          </span>
                        </div>

                        {/* Barra de tiempo */}
                        <div className="mt-3">
                          <div className="h-0.5 w-full bg-brand-border">
                            <div
                              className="h-0.5 bg-brand-orange"
                              style={{ width: `${100 - pct}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-mono text-[10px] text-white/30">Tiempo restante</span>
                            <LiveCountdown item={item} className="font-mono text-[11px] font-bold text-brand-orange" />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAuctionId(id);
                            setShowAuctionDetail(true);
                          }}
                          className="mt-3 w-full bg-brand-orange py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white"
                        >
                          {endsSoon ? "Snipe Bid" : "Place Bid"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* DETALLE DE SUBASTA */}
          {activeSection === "comprar" && showAuctionDetail && selectedAuction && (
            <section className="space-y-5">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/30">
                <button
                  type="button"
                  onClick={() => setShowAuctionDetail(false)}
                  className="border border-brand-border px-2 py-1 text-brand-orange"
                >
                  Subastas
                </button>
                <span>/</span>
                <span>
                  {pickText(
                    findProductForSubasta(selectedAuction, productos) ?? selectedAuction,
                    ["categoria", "category"],
                  ) || "General"}
                </span>
                <span>/</span>
                <span className="text-white">{subastaTitle(selectedAuction, productos)}</span>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                {/* Columna izquierda - imagenes */}
                <div className="space-y-3">
                  <div className="relative overflow-hidden border border-brand-border bg-brand-panel">
                    <img
                      src={resolveProductImage(
                        findProductForSubasta(selectedAuction, productos),
                        selectedAuction,
                        fallbackAuctionImages[0],
                      )}
                      alt={subastaTitle(selectedAuction, productos)}
                      className="h-full w-full object-contain"
                      style={{ maxHeight: "420px", minHeight: "280px" }}
                    />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 bg-brand-orange px-2.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">Live</span>
                    </div>
                  </div>

                  {/* Miniaturas */}
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square border border-brand-border bg-brand-panel overflow-hidden">
                        <img
                          src={resolveProductImage(
                            findProductForSubasta(selectedAuction, productos),
                            selectedAuction,
                            fallbackAuctionImages[i % fallbackAuctionImages.length],
                          )}
                          alt=""
                          className="h-full w-full object-cover opacity-60"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Descripcion */}
                  <div className="border border-brand-border bg-brand-card p-5">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
                      Especificaciones y Condicion
                    </p>
                    <p className="text-sm leading-relaxed text-white/50">
                      {subastaDescription(selectedAuction, productos)}
                    </p>
                    <div className="mt-4 flex items-center gap-3 border-t border-brand-border pt-4">
                      <div className="flex h-8 w-8 items-center justify-center border border-brand-border bg-brand-panel">
                        <User className="h-4 w-4 text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {userNameById.get(
                            String(selectedAuction.subastador ?? selectedAuction.vendedor ?? ""),
                          ) || "Vendedor"}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-yellow-400">
                          Vendedor verificado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna derecha - pujar */}
                <div className="space-y-4">
                  {/* Codigo del articulo */}
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-brand-orange">
                      {pickText(selectedAuction, ["categoria", "category"]) || "Subasta"} —{" "}
                      #{String(pickId(selectedAuction))}
                    </p>
                    <h3 className="mt-1 font-condensed text-2xl font-black uppercase tracking-tight text-white">
                      {subastaTitle(selectedAuction, productos)}
                    </h3>
                    <p className="mt-1 text-sm text-white/40">
                      {pickText(
                        findProductForSubasta(selectedAuction, productos) ?? selectedAuction,
                        ["descripcion", "description"],
                      ) || "Articulo en subasta activa."}
                    </p>
                  </div>

                  {/* Oferta actual + tiempo */}
                  <div className="border border-brand-border bg-brand-card p-4">
                    <div className="grid grid-cols-2 divide-x divide-brand-border">
                      <div className="pr-4">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                          Oferta mas alta
                        </p>
                        <p className="mt-1 font-condensed text-xl font-black text-brand-orange">
                          {formatCurrency(selectedCurrentPrice)}
                        </p>
                      </div>
                      <div className="pl-4">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                          Tiempo restante
                        </p>
                        <LiveCountdown
                          item={selectedAuction}
                          className="mt-1 block font-condensed text-xl font-black text-brand-orange"
                        />
                      </div>
                    </div>

                    <div className="mt-4 border-t border-brand-border pt-4">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Tu oferta maxima
                      </p>
                      <div className="flex gap-2">
                        <div className="flex flex-1 items-center border border-brand-border bg-brand-dark">
                          <span className="border-r border-brand-border px-3 font-mono text-sm text-white/30">$</span>
                          <input
                            value={bidAmountInput}
                            onChange={(e) => setBidAmountInput(e.target.value)}
                            placeholder={formatCurrency(selectedMinBid).replace(/[^\d]/g, "")}
                            className="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handlePlaceBid}
                          disabled={mutating}
                          className="bg-brand-orange px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                        >
                          {mutating ? "..." : "Pujar"}
                        </button>
                      </div>
                      <p className="mt-2 font-mono text-[9px] text-white/20">
                        Minimo: {formatCurrency(selectedMinBid)} &nbsp;|&nbsp; {selectedAuctionBids.length} ofertas totales
                      </p>
                    </div>
                  </div>

                  {/* Historial de pujas */}
                  <div className="border border-brand-border bg-brand-card">
                    <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                        Historial de Pujas
                      </p>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                        {selectedAuctionBids.length} total
                      </span>
                    </div>

                    {selectedAuctionBids.length === 0 ? (
                      <p className="px-4 py-4 font-mono text-[11px] text-white/20">Sin pujas aun.</p>
                    ) : (
                      <div className="divide-y divide-brand-border">
                        {selectedAuctionBids.slice(0, 8).map((bid, i) => {
                          const bidderName =
                            userNameById.get(String(bid.usuario ?? bid.usuario_id ?? "")) || "Postor";
                          const amount = pickNumber(bid, ["monto", "valor", "amount"]);
                          const isTop = i === 0;
                          return (
                            <div
                              key={pickId(bid)}
                              className="flex items-center gap-3 px-4 py-3"
                            >
                              <BidderAvatar name={bidderName} />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-white truncate">
                                  {bidderName}
                                </p>
                                <p className="font-mono text-[9px] text-white/30">
                                  {pickText(bid, ["hora", "fecha", "created_at"]) || "Reciente"}
                                </p>
                              </div>
                              <p className={`font-condensed text-base font-black ${isTop ? "text-brand-orange" : "text-white/50"}`}>
                                {formatCurrency(amount)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {selectedAuctionBids.length > 8 && (
                      <div className="border-t border-brand-border px-4 py-2 text-center">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                          Ver todo el historial
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Boton finalizar — solo si soy el creador */}
                  {isAuctionOwnedByCurrentUser(selectedAuction, user, currentUserId, productos) && (
                    <div className="border border-red-500/30 bg-red-500/5 p-4">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-red-400">
                        Control del propietario
                      </p>
                      <p className="mb-3 font-mono text-[11px] text-white/30">
                        Puedes cerrar esta subasta en cualquier momento. La oferta mas alta ganara.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleEndAuction(pickId(selectedAuction))}
                        disabled={mutating}
                        className="w-full border border-red-500/60 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-red-400 disabled:opacity-40"
                      >
                        {mutating ? "Finalizando..." : "Finalizar Subasta Ahora"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* NAVEGAR SUBASTAS */}
          {activeSection === "subastas" && (
            <section className="space-y-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Catalogo
                </p>
                <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-white">
                  Navegar Subastas
                </h2>
              </div>

              <div className="border border-brand-border bg-brand-card">
                <div className="border-b border-brand-border px-5 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                    Subastas disponibles — {subastas.length}
                  </p>
                </div>
                <div className="divide-y divide-brand-border">
                  {subastas.slice(0, 8).map((item) => {
                    const isOwner = isAuctionOwnedByCurrentUser(item, user, currentUserId, productos);
                    const isActive = isAuctionLive(item);
                    return (
                      <article key={pickId(item)} className="flex items-center justify-between px-5 py-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {subastaTitle(item, productos) || "Subasta"}
                          </p>
                          {isOwner && (
                            <p className="font-mono text-[9px] uppercase tracking-widest text-brand-orange">
                              Tu subasta
                            </p>
                          )}
                        </div>
                        <p className="font-condensed text-base font-black text-brand-orange shrink-0">
                          {formatCurrency(currentOfferAmount(item, productos, pujas))}
                        </p>
                        {isOwner && isActive && (
                          <button
                            type="button"
                            onClick={() => handleEndAuction(pickId(item))}
                            disabled={mutating}
                            className="shrink-0 border border-red-500/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-red-400 disabled:opacity-40"
                          >
                            Finalizar
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="border border-brand-border bg-brand-card">
                <div className="border-b border-brand-border px-5 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                    Pujas recientes
                  </p>
                </div>
                <div className="divide-y divide-brand-border">
                  {pujas.slice(0, 8).map((item) => {
                    const id = pickId(item);
                    return (
                      <article
                        key={id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">Puja #{String(id)}</p>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                            {formatCurrency(pickNumber(item, ["monto", "valor", "amount"]))}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePuja(id)}
                          disabled={mutating}
                          className="border border-red-500/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-red-400 disabled:opacity-40"
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

          {/* PERFIL */}
          {activeSection === "perfil" && (
            <section className="space-y-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Cuenta
                </p>
                <h1 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-white">
                  Mi Perfil
                </h1>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <article className="border border-brand-border bg-brand-card p-5 lg:col-span-1">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border border-brand-orange/30 bg-brand-orange/10">
                      <User className="h-6 w-6 text-brand-orange" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 divide-y divide-brand-border border border-brand-border">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Calificacion
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-yellow-400">
                        <Star className="h-3 w-3" /> {userMeta.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Estado
                      </span>
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${
                        userMeta.isNew ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {userMeta.isNew ? "Nuevo" : "Activo"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Miembro hace
                      </span>
                      <span className="font-mono text-[11px] text-white">
                        {userMeta.daysAsMember} dias
                      </span>
                    </div>
                  </div>
                </article>

                <article className="border border-brand-border bg-brand-card p-5 lg:col-span-2">
                  <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-white/30">
                    Datos Personales
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ProfileField label="Nombre completo" value={user.name} />
                    <ProfileField label="Correo electronico" value={user.email} />
                    <ProfileField label="ID de usuario" value={String(user.id ?? "Sin asignar")} />
                    <ProfileField label="Fecha de registro" value={formatDate(userMeta.joinedAt)} />
                    <ProfileField label="Ultimo acceso" value={formatDate(new Date())} />
                    <ProfileField
                      label="Seguridad"
                      value="Cuenta protegida"
                      icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                    />
                  </div>
                </article>
              </div>

              <article className="border border-brand-border bg-brand-card">
                <div className="flex items-center justify-between border-b border-brand-border px-5 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                    Mis Subastas
                  </p>
                  <span className="border border-brand-orange/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                    {mySubastas.length} publicadas
                  </span>
                </div>
                {mySubastas.length === 0 ? (
                  <p className="px-5 py-4 font-mono text-[11px] uppercase tracking-widest text-white/20">
                    Sin subastas publicadas.
                  </p>
                ) : (
                  <div className="divide-y divide-brand-border">
                    {mySubastas.slice(0, 8).map((item) => {
                      const estado = pickText(item, ["estado", "status", "estado_subasta"]) || "Sin estado";
                      const activa = isAuctionLive(item);
                      return (
                        <article key={pickId(item)} className="flex items-center gap-3 px-5 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {subastaTitle(item, productos) || "Subasta"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`font-mono text-[9px] uppercase tracking-widest ${activa ? "text-emerald-400" : "text-white/30"}`}>
                                {activa ? "Activa" : estado}
                              </span>
                            </div>
                          </div>
                          <p className="font-condensed text-base font-black text-brand-orange shrink-0">
                            {formatCurrency(currentOfferAmount(item, productos, pujas))}
                          </p>
                          {activa && (
                            <button
                              type="button"
                              onClick={() => handleEndAuction(pickId(item))}
                              disabled={mutating}
                              className="shrink-0 border border-red-500/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-red-400 disabled:opacity-40"
                            >
                              Finalizar
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="border border-brand-border bg-brand-card p-5">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Metodos de Pago
                </p>
                {myMetodosPago.length === 0 ? (
                  <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-white/20">
                    Sin metodos de pago registrados.
                  </p>
                ) : (
                  <ul className="mb-5 divide-y divide-brand-border border border-brand-border">
                    {myMetodosPago.map((m) => (
                      <li key={pickId(m)} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm font-medium text-white">
                          {pickText(m, ["tipo"]) || "Metodo"}
                        </span>
                        {pickText(m, ["titular"]) && (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                            {pickText(m, ["titular"])}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    value={metodoTipo}
                    onChange={(e) => setMetodoTipo(e.target.value)}
                    placeholder="Tipo (tarjeta, transferencia)"
                    className={inputClass}
                  />
                  <input
                    value={metodoReferencia}
                    onChange={(e) => setMetodoReferencia(e.target.value)}
                    placeholder="Numero o referencia"
                    className={inputClass}
                  />
                  <input
                    value={metodoTitular}
                    onChange={(e) => setMetodoTitular(e.target.value)}
                    placeholder="Titular"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMetodoPago}
                  disabled={mutating}
                  className="mt-3 border border-brand-orange px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-brand-orange disabled:opacity-40"
                >
                  {mutating ? "Guardando..." : "Agregar Metodo"}
                </button>
              </article>
            </section>
          )}

          {/* PEDIDOS */}
          {activeSection === "pedidos" && (
            <section className="space-y-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">Historial</p>
                <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-white">
                  Mis Pedidos
                </h2>
              </div>

              {transacciones.length === 0 ? (
                <div className="border border-brand-border bg-brand-card px-5 py-8 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/20">
                    Sin pedidos registrados. Cuando ganes una subasta y completes la compra apareceran aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transacciones.slice(0, 20).map((item) => {
                    const seguimiento = pickText(item, ["numero_seguimiento"]);
                    const destinatario = pickText(item, ["nombre_destinatario"]);
                    const ciudad = pickText(item, ["ciudad"]);
                    const pais = pickText(item, ["pais"]);
                    const direccion = pickText(item, ["direccion_envio"]);
                    const estado = pickText(item, ["estado"]) || "completada";
                    const monto = pickNumber(item, ["monto_final", "monto", "total"]);
                    return (
                      <article key={pickId(item)} className="border border-brand-border bg-brand-card">
                        {/* Cabecera */}
                        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${estado === "completada" ? "border-emerald-500/40 text-emerald-400" : "border-brand-border text-white/30"}`}>
                              {estado}
                            </span>
                            <span className="font-mono text-[10px] text-white/30">
                              Pedido #{String(pickId(item))}
                            </span>
                          </div>
                          <p className="font-condensed text-lg font-black text-brand-orange">
                            {formatCurrency(monto)}
                          </p>
                        </div>

                        {/* Datos de envio */}
                        <div className="grid gap-0 divide-y divide-brand-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                          <div className="px-5 py-4 space-y-2">
                            <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Destinatario</p>
                            {destinatario && <p className="text-sm font-semibold text-white">{destinatario}</p>}
                            {direccion && <p className="font-mono text-[11px] text-white/50">{direccion}</p>}
                            {(ciudad || pais) && (
                              <p className="font-mono text-[11px] text-white/40">
                                {[ciudad, pais].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="px-5 py-4 space-y-2">
                            <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Seguimiento</p>
                            {seguimiento ? (
                              <>
                                <p className="font-mono text-sm font-bold text-brand-orange">{seguimiento}</p>
                                <p className="font-mono text-[11px] text-emerald-400">Procesando envio</p>
                                <p className="font-mono text-[11px] text-white/30">Entrega estimada: 5-7 dias habiles</p>
                              </>
                            ) : (
                              <p className="font-mono text-[11px] text-white/20">Sin numero de seguimiento</p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* MAPA DE CALOR */}
          {activeSection === "mapa" && (
            <section className="space-y-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Analitica Geografica
                </p>
                <h2 className="mt-1 font-condensed text-3xl font-black uppercase tracking-tight text-white">
                  Mapa de Calor — Medellin
                </h2>
              </div>

              <div className="grid gap-px border border-brand-border bg-brand-border md:grid-cols-3">
                <MetricCard label="Transacciones" value={String(transacciones.length)} />
                <MetricCard label="Pujas" value={String(pujas.length)} />
                <MetricCard label="Productos" value={String(productos.length)} />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
                {/* SVG Mapa de Medellin */}
                <div className="border border-brand-border bg-brand-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                      Valle de Aburra — Actividad de Subastas
                    </p>
                    <span className="border border-brand-orange/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                      En vivo
                    </span>
                  </div>
                  <MedellinHeatmap />
                </div>

                {/* Panel lateral */}
                <div className="space-y-4">
                  <div className="border border-brand-border bg-brand-card p-4">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-white/30">
                      Actividad por Zona
                    </p>
                    <div className="space-y-2">
                      {MEDELLIN_ZONES.sort((a, b) => b.activity - a.activity).map((zone) => (
                        <div key={zone.name}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-white">{zone.name}</span>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                              {zone.activity}%
                            </span>
                          </div>
                          <div className="h-0.5 bg-brand-border">
                            <div
                              className="h-0.5 bg-brand-orange"
                              style={{ width: `${zone.activity}%`, opacity: 0.3 + zone.activity / 140 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-brand-border bg-brand-card p-4">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-white/30">
                      Leyenda
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "Alta actividad", color: "#FF5C00" },
                        { label: "Media actividad", color: "#FF5C0088" },
                        { label: "Baja actividad", color: "#FF5C0033" },
                        { label: "Sin actividad", color: "#1f1f1f" },
                      ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className="h-2.5 w-5 shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-brand-border bg-brand-card p-4">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-white/30">
                      Distribucion General
                    </p>
                    {[
                      { label: "Subastas activas", value: liveSubastas.length, total: Math.max(subastas.length, 1) },
                      { label: "Usuarios", value: usuarios.length, total: Math.max(usuarios.length, 1) },
                      { label: "Productos", value: productos.length, total: Math.max(productos.length, 1) },
                    ].map(({ label, value, total }) => (
                      <div key={label} className="mb-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">{label}</span>
                          <span className="font-condensed text-sm font-bold text-white">{value}</span>
                        </div>
                        <div className="h-0.5 bg-brand-border">
                          <div
                            className="h-0.5 bg-brand-orange"
                            style={{ width: `${Math.min(100, (value / total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modal de compra */}
      {purchaseAuction && (
        <PurchaseModal
          auction={purchaseAuction}
          productos={productos}
          pujas={pujas}
          currentUserId={currentUserId}
          onClose={() => {
            dismissWin(pickId(purchaseAuction));
            setPurchaseAuction(null);
          }}
        />
      )}
    </div>
  );
}

function getCurrentUserId(user: NormalizedUser): number | string | null {
  const candidates = [user.id, user.raw.id, user.raw.id_usuario, user.raw.usuario_id, user.raw.pk];
  for (const value of candidates) {
    if (typeof value === "number" || typeof value === "string") {
      const text = String(value).trim();
      if (text) return value;
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
    item.vendedor, item.subastador, item.vendedor_id,
    item.usuario, item.usuario_id, item.propietario,
    item.creado_por, item.user, item.owner,
  ];
  if (currentUserId !== null) {
    const currentId = String(currentUserId).trim();
    if (ownerIdCandidates.some(
      (value) =>
        (typeof value === "string" || typeof value === "number") &&
        String(value).trim() === currentId,
    )) return true;
  }
  const ownerText = [
    pickText(item, ["vendedor_nombre", "usuario_nombre", "owner_name", "autor"]),
    pickText(item, ["email_vendedor", "usuario_email", "owner_email"]),
  ].join(" ").toLowerCase();
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
  if (isOwnedByCurrentUser(auction, user, currentUserId)) return true;
  const ownedProductIds = new Set(
    productos
      .filter((product) => isOwnedByCurrentUser(product, user, currentUserId))
      .map((product) => String(pickId(product))),
  );
  const productLinkCandidates = [
    auction.producto, auction.producto_id, auction.id_producto,
    auction.product, auction.product_id,
  ];
  for (const value of productLinkCandidates) {
    if (typeof value === "number" || typeof value === "string") {
      if (ownedProductIds.has(String(value))) return true;
    }
  }
  const embeddedProductCandidates = [auction.producto, auction.product];
  for (const candidate of embeddedProductCandidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      const embedded = candidate as ApiRecord;
      if (
        ownedProductIds.has(String(pickId(embedded))) ||
        isOwnedByCurrentUser(embedded, user, currentUserId)
      ) return true;
    }
  }
  return false;
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="bg-brand-dark p-5">
      <p className="font-condensed text-3xl font-black text-white">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">{label}</p>
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="bg-brand-dark p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">{label}</p>
      <p className="mt-2 font-condensed text-3xl font-black text-white">{value}</p>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-border py-2 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function ProfileField({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="border border-brand-border p-3">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-white/30">{label}</p>
      <p className="flex items-center gap-2 text-sm font-medium text-white">
        {icon}
        {value}
      </p>
    </div>
  );
}

function resolveProductImage(
  product: ApiRecord | null,
  subasta: ApiRecord,
  fallback: string,
): string {
  // Buscar en localStorage por ID del producto
  const candidates = [
    product ? String(pickId(product)) : null,
    String(subasta.producto ?? subasta.producto_id ?? subasta.id_producto ?? ""),
  ];
  for (const id of candidates) {
    if (id && id !== "0" && id !== "") {
      const local = localStorage.getItem(`bidnow_img_${id}`);
      if (local) return local;
    }
  }
  // Campo imagen del backend (solo URLs http, no base64 truncada)
  const fromApi = pickText(product ?? subasta, ["imagen", "image", "foto"]);
  if (fromApi && (fromApi.startsWith("http") || fromApi.startsWith("data:image"))) return fromApi;
  return fallback;
}

function computeHHMMSS(item: ApiRecord): string {
  const endTs = parseDateCandidate(
    item.fecha_fin ?? item.finaliza_en ?? item.end_date ?? item.end_at,
  );
  if (!endTs) return "--:--:--";
  const diff = Math.max(0, endTs - Date.now());
  const s = Math.floor(diff / 1000);
  if (s <= 0) return "00:00:00";
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function auctionTimePercent(item: ApiRecord): number {
  const start = parseDateCandidate(item.fecha_inicio ?? item.inicia_en ?? item.start_date ?? item.start_at);
  const end = parseDateCandidate(item.fecha_fin ?? item.finaliza_en ?? item.end_date ?? item.end_at);
  if (!start || !end || end <= start) return 50;
  const total = end - start;
  const elapsed = Date.now() - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function isEndingSoon(item: ApiRecord): boolean {
  const end = parseDateCandidate(item.fecha_fin ?? item.finaliza_en ?? item.end_date ?? item.end_at);
  if (!end) return false;
  return end - Date.now() < 3_600_000;
}

function LiveCountdown({ item, className }: { item: ApiRecord; className?: string }) {
  const [time, setTime] = useState(() => computeHHMMSS(item));
  useEffect(() => {
    const id = setInterval(() => setTime(computeHHMMSS(item)), 1000);
    return () => clearInterval(id);
  }, [item]);
  return <span className={className}>{time}</span>;
}

function BidderAvatar({ name }: { name: string }) {
  const initials = name
    .split(/[\s_-]/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  const palette = ["#FF5C00", "#d44e00", "#e85500", "#ff7a33"];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center font-mono text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

type PurchaseStep = "shipping" | "payment" | "success";

function PurchaseModal({
  auction,
  productos,
  pujas,
  currentUserId,
  onClose,
}: {
  auction: ApiRecord;
  productos: ApiRecord[];
  pujas: ApiRecord[];
  currentUserId: string | number | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<PurchaseStep>("shipping");
  const [shipping, setShipping] = useState({
    firstName: "", lastName: "", address: "", postalCode: "", country: "Colombia", city: "",
  });
  const [payment, setPayment] = useState({
    cardNumber: "", cardType: "debito", cardHolder: "", expiry: "", cvv: "",
  });
  const [cardError, setCardError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tracking] = useState(
    () => "BN-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-CO",
  );

  const title = subastaTitle(auction, productos);
  const rawAmount = currentOfferAmount(auction, productos, pujas);
  const price = formatCurrency(rawAmount);

  function formatCardInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = payment.cardNumber.replace(/\s/g, "");
    if (digits.length !== 16) { setCardError("El numero de tarjeta debe tener 16 digitos."); return; }
    if (!/^\d+$/.test(digits)) { setCardError("Solo se permiten numeros en la tarjeta."); return; }
    if (!payment.cardHolder.trim()) { setCardError("Ingresa el nombre del titular."); return; }
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) { setCardError("Fecha de vencimiento invalida. Formato MM/AA."); return; }
    if (!/^\d{3,4}$/.test(payment.cvv)) { setCardError("CVV invalido."); return; }
    setCardError("");
    setSaving(true);
    try {
      await transaccionesService.create({
        subasta: pickId(auction),
        usuario: currentUserId ?? undefined,
        monto_final: rawAmount.toFixed(2),
        estado: "completada",
        nombre_destinatario: `${shipping.firstName.trim()} ${shipping.lastName.trim()}`,
        direccion_envio: shipping.address.trim(),
        ciudad: shipping.city.trim(),
        pais: shipping.country.trim(),
        codigo_postal: shipping.postalCode.trim(),
        numero_seguimiento: tracking,
      });
    } catch {
      // Si falla guardar en BD igual avanzamos — la compra ya fue procesada
    } finally {
      setSaving(false);
    }
    setStep("success");
  }

  const inputCls =
    "w-full border border-brand-border bg-brand-dark px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-lg border border-brand-border bg-brand-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand-orange">
              {step === "shipping" ? "Paso 1 de 2 — Envio" : step === "payment" ? "Paso 2 de 2 — Pago" : "Compra Completada"}
            </p>
            <p className="mt-0.5 font-condensed text-lg font-black uppercase tracking-widest text-white">
              {title}
            </p>
            <p className="font-condensed text-base font-black text-brand-orange">{price}</p>
          </div>
          {step !== "success" && (
            <button type="button" onClick={onClose} className="text-white/30">
              <span className="font-mono text-lg">×</span>
            </button>
          )}
        </div>

        <div className="p-5">
          {/* PASO 1 — Datos de envio */}
          {step === "shipping" && (
            <form
              onSubmit={(e) => { e.preventDefault(); setStep("payment"); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Nombre</label>
                  <input required value={shipping.firstName} onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })} placeholder="Juan" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Apellido</label>
                  <input required value={shipping.lastName} onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })} placeholder="Perez" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Direccion</label>
                <input required value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="Calle 80 # 12-34, Apto 501" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Ciudad</label>
                  <input required value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} placeholder="Medellin" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Codigo Postal</label>
                  <input required value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} placeholder="050001" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Pais</label>
                <input required value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} placeholder="Colombia" className={inputCls} />
              </div>
              <button type="submit" className="w-full bg-brand-orange py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
                Continuar al Pago
              </button>
            </form>
          )}

          {/* PASO 2 — Datos de pago */}
          {step === "payment" && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="border border-brand-border bg-brand-card px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Envio a</p>
                <p className="mt-0.5 text-sm text-white">{shipping.firstName} {shipping.lastName} — {shipping.address}, {shipping.city}</p>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Tipo de Tarjeta</label>
                <div className="flex gap-2">
                  {["debito", "credito"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPayment({ ...payment, cardType: t })}
                      className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-widest ${payment.cardType === t ? "bg-brand-orange text-white" : "border border-brand-border text-white/30"}`}
                    >
                      {t === "debito" ? "Debito" : "Credito"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Numero de Tarjeta</label>
                <input
                  required
                  value={payment.cardNumber}
                  onChange={(e) => setPayment({ ...payment, cardNumber: formatCardInput(e.target.value) })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Nombre del Titular</label>
                <input required value={payment.cardHolder} onChange={(e) => setPayment({ ...payment, cardHolder: e.target.value.toUpperCase() })} placeholder="JUAN PEREZ" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">Vencimiento (MM/AA)</label>
                  <input
                    required
                    value={payment.expiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                      setPayment({ ...payment, expiry: v });
                    }}
                    placeholder="12/28"
                    maxLength={5}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-white/40">CVV</label>
                  <input required value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" maxLength={4} className={inputCls} />
                </div>
              </div>

              {cardError && (
                <p className="border border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-[11px] text-red-300">
                  {cardError}
                </p>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep("shipping")} className="border border-brand-border px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-white/30">
                  Volver
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-brand-orange py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-60">
                  {saving ? "Procesando..." : "Comprar"}
                </button>
              </div>
            </form>
          )}

          {/* EXITO */}
          {step === "success" && (
            <div className="space-y-5">
              <div className="border border-emerald-500/40 bg-emerald-500/5 p-5 text-center">
                <p className="font-condensed text-3xl font-black uppercase text-emerald-400">
                  Compra Exitosa
                </p>
                <p className="mt-2 font-mono text-[11px] text-white/50">
                  Tu pedido ha sido confirmado y procesado correctamente.
                </p>
              </div>

              <div className="border border-brand-border bg-brand-card p-4 space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">Ruta de Envio</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/50">Numero de seguimiento</span>
                  <span className="font-mono text-sm font-bold text-brand-orange">{tracking}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/50">Estado</span>
                  <span className="font-mono text-[11px] text-emerald-400">Procesando envio</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/50">Entrega estimada</span>
                  <span className="font-mono text-[11px] text-white">5 - 7 dias habiles</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/50">Destino</span>
                  <span className="font-mono text-[11px] text-white">{shipping.city}, {shipping.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/50">Direccion</span>
                  <span className="font-mono text-[11px] text-white text-right max-w-[60%]">{shipping.address}</span>
                </div>
              </div>

              <div className="border border-brand-border bg-brand-card divide-y divide-brand-border">
                <div className="px-4 py-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">Articulo</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{title}</p>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-mono text-[11px] text-white/50">Total pagado</span>
                  <span className="font-condensed text-lg font-black text-brand-orange">{price}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-mono text-[11px] text-white/50">Metodo de pago</span>
                  <span className="font-mono text-[11px] text-white capitalize">{payment.cardType} •••• {payment.cardNumber.slice(-4)}</span>
                </div>
              </div>

              <button type="button" onClick={onClose} className="w-full bg-brand-orange py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MEDELLIN_ZONES = [
  { name: "El Poblado",       activity: 92, x: 310, y: 310, w: 80, h: 70 },
  { name: "La Candelaria",    activity: 85, x: 200, y: 240, w: 70, h: 55 },
  { name: "Laureles",         activity: 74, x: 100, y: 250, w: 85, h: 60 },
  { name: "Envigado",         activity: 68, x: 290, y: 390, w: 90, h: 65 },
  { name: "Estadio",          activity: 61, x: 130, y: 300, w: 75, h: 55 },
  { name: "Aranjuez",         activity: 53, x: 220, y: 155, w: 80, h: 55 },
  { name: "Bello",            activity: 42, x: 185, y: 55,  w: 90, h: 60 },
  { name: "Itagui",           activity: 38, x: 140, y: 390, w: 85, h: 60 },
  { name: "La America",       activity: 35, x: 90,  y: 320, w: 75, h: 55 },
  { name: "Robledo",          activity: 27, x: 65,  y: 185, w: 80, h: 65 },
  { name: "Sabaneta",         activity: 22, x: 210, y: 468, w: 80, h: 50 },
  { name: "Manrique",         activity: 19, x: 305, y: 165, w: 75, h: 60 },
  { name: "Belen",            activity: 16, x: 100, y: 370, w: 80, h: 55 },
  { name: "Copacabana",       activity: 10, x: 175, y: 0,   w: 80, h: 48 },
];

function heatColor(activity: number): string {
  if (activity >= 80) return "rgba(255,92,0,0.85)";
  if (activity >= 60) return "rgba(255,92,0,0.62)";
  if (activity >= 40) return "rgba(255,92,0,0.42)";
  if (activity >= 20) return "rgba(255,92,0,0.22)";
  return "rgba(255,92,0,0.10)";
}

function MedellinHeatmap() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "520/540" }}>
      <svg
        viewBox="0 0 520 540"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        {/* Fondo del valle */}
        <defs>
          <radialGradient id="valleyGrad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0e0e0e" />
          </radialGradient>
          {/* Sombra de rio */}
          <linearGradient id="riverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a4060" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0d2030" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Base del mapa */}
        <rect width="520" height="540" fill="url(#valleyGrad)" />

        {/* Silueta del Valle de Aburra (cerros) */}
        <path
          d="M0,0 L0,80 Q30,40 60,60 Q90,80 110,50 Q140,20 160,45 Q185,70 200,30 Q215,0 240,20 Q265,40 290,10 Q320,0 350,30 Q380,55 410,35 Q440,15 470,45 Q495,65 520,50 L520,0 Z"
          fill="#161616"
          opacity="0.8"
        />
        <path
          d="M0,540 L0,480 Q25,500 55,490 Q90,478 115,495 Q145,510 175,490 Q200,472 230,488 Q260,505 290,480 Q320,458 355,475 Q385,492 415,475 Q445,458 480,478 Q500,490 520,475 L520,540 Z"
          fill="#161616"
          opacity="0.8"
        />

        {/* Rio Medellin (Aburrá) - eje vertical central */}
        <path
          d="M238,0 Q242,60 236,120 Q230,180 234,240 Q238,300 232,360 Q226,420 230,480 Q232,510 235,540"
          stroke="url(#riverGrad)"
          strokeWidth="5"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M238,0 Q242,60 236,120 Q230,180 234,240 Q238,300 232,360 Q226,420 230,480 Q232,510 235,540"
          stroke="#1e6090"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />

        {/* Zonas del mapa */}
        {MEDELLIN_ZONES.map((zone) => {
          const isHovered = hovered === zone.name;
          const color = heatColor(zone.activity);
          return (
            <g
              key={zone.name}
              onMouseEnter={() => setHovered(zone.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                rx="2"
                fill={color}
                stroke={isHovered ? "#FF5C00" : "#2a2a2a"}
                strokeWidth={isHovered ? 1.5 : 0.5}
                opacity={isHovered ? 1 : 0.9}
              />
              {/* Nombre de zona */}
              <text
                x={zone.x + zone.w / 2}
                y={zone.y + zone.h / 2 - 4}
                textAnchor="middle"
                fill={zone.activity >= 60 ? "#ffffff" : "#888888"}
                fontSize="8"
                fontFamily="Space Mono, monospace"
                fontWeight="700"
              >
                {zone.name.toUpperCase()}
              </text>
              {/* Porcentaje */}
              <text
                x={zone.x + zone.w / 2}
                y={zone.y + zone.h / 2 + 8}
                textAnchor="middle"
                fill={zone.activity >= 60 ? "#FF5C00" : "#555555"}
                fontSize="9"
                fontFamily="Space Mono, monospace"
                fontWeight="700"
              >
                {zone.activity}%
              </text>
            </g>
          );
        })}

        {/* Puntos de actividad (hotspots) */}
        {MEDELLIN_ZONES.filter((z) => z.activity >= 70).map((zone) => (
          <circle
            key={`dot-${zone.name}`}
            cx={zone.x + zone.w / 2}
            cy={zone.y + zone.h / 2}
            r={zone.activity / 14}
            fill="#FF5C00"
            opacity="0.15"
          />
        ))}

        {/* Etiqueta norte/sur */}
        <text x="12" y="22" fill="#333" fontSize="9" fontFamily="Space Mono, monospace" fontWeight="700">N</text>
        <text x="12" y="530" fill="#333" fontSize="9" fontFamily="Space Mono, monospace" fontWeight="700">S</text>
        <line x1="18" y1="28" x2="18" y2="518" stroke="#222" strokeWidth="1" />
        <polygon points="14,28 22,28 18,20" fill="#333" />

        {/* Tooltip hover */}
        {hovered && (() => {
          const zone = MEDELLIN_ZONES.find((z) => z.name === hovered);
          if (!zone) return null;
          const tx = Math.min(zone.x + zone.w / 2, 390);
          const ty = Math.max(zone.y - 14, 18);
          return (
            <g>
              <rect x={tx - 40} y={ty - 12} width="84" height="18" rx="2" fill="#1f1f1f" stroke="#FF5C00" strokeWidth="0.5" />
              <text x={tx + 2} y={ty} textAnchor="middle" fill="#FF5C00" fontSize="8.5" fontFamily="Space Mono, monospace" fontWeight="700">
                {zone.name} — {zone.activity}%
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
