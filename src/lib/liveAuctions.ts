import type { ApiRecord } from "../services/apiServices";

export function pickText(item: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export function pickNumber(item: ApiRecord, keys: string[]): number {
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

export function pickId(item: ApiRecord): string | number {
  const value =
    item.id_subasta ??
    item.id_producto ??
    item.id_puja ??
    item.id_usuario ??
    item.id_transaccion ??
    item.id_metodo_pago ??
    item.id ??
    item.pk;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  return 0;
}

export function pickIdOrNull(item: ApiRecord): string | number | null {
  const id = pickId(item);
  return id === 0 ? null : id;
}

export function isSameId(left: unknown, right: unknown): boolean {
  if (left === null || left === undefined || right === null || right === undefined) {
    return false;
  }
  return String(left).trim() === String(right).trim();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseDateCandidate(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function formatCountdownLabel(item: ApiRecord): string {
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

export function isAuctionLive(item: ApiRecord): boolean {
  const booleanFlags = [item.en_vivo, item.is_live, item.activa, item.activo, item.live];
  if (booleanFlags.some((value) => value === true)) {
    return true;
  }

  const status = pickText(item, ["estado", "status", "estado_subasta"]).toLowerCase();
  if (["en vivo", "activa", "activo", "live", "open", "abierta"].includes(status)) {
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

export function findProductForSubasta(
  subasta: ApiRecord,
  productos: ApiRecord[],
): ApiRecord | null {
  const pid = subasta.producto ?? subasta.producto_id ?? subasta.id_producto;
  if (pid === undefined || pid === null) {
    return null;
  }
  const key = String(pid);
  return (
    productos.find((p) => String(p.id_producto ?? p.id ?? "") === key) ?? null
  );
}

export function highestBidAmountForSubasta(
  pujas: ApiRecord[],
  subastaId: string | number,
): number {
  let max = 0;
  for (const p of pujas) {
    const sid = p.subasta ?? p.subasta_id ?? p.id_subasta;
    if (!isSameId(sid, subastaId)) {
      continue;
    }
    const m = pickNumber(p, ["monto", "valor", "amount"]);
    if (m > max) {
      max = m;
    }
  }
  return max;
}

export function currentOfferAmount(
  subasta: ApiRecord,
  productos: ApiRecord[],
  pujas: ApiRecord[],
): number {
  const sid = pickId(subasta);
  const fromBids = highestBidAmountForSubasta(pujas, sid);
  if (fromBids > 0) {
    return fromBids;
  }
  const prod = findProductForSubasta(subasta, productos);
  return prod ? pickNumber(prod, ["precio_inicial", "precio"]) : 0;
}

export function toDecimalString(value: number): string {
  return value.toFixed(2);
}

export function subastaTitle(subasta: ApiRecord, productos: ApiRecord[]): string {
  const product = findProductForSubasta(subasta, productos);
  return (
    pickText(product ?? subasta, ["titulo", "title", "nombre"]) || "Subasta en vivo"
  );
}

export function subastaDescription(subasta: ApiRecord, productos: ApiRecord[]): string {
  const product = findProductForSubasta(subasta, productos);
  return (
    pickText(product ?? subasta, ["descripcion", "description", "detalle"]) ||
    "Descripcion no disponible para esta subasta."
  );
}
