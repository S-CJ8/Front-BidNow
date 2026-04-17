import { FormEvent, useState } from "react";
import { useApiRequest } from "../hooks/useApiRequest";
import { getApiBaseUrl } from "../lib/httpClient";
import { productosService, pujasService, usuariosService } from "../services/apiServices";

type JsonRecord = Record<string, unknown>;

const defaultCreateUserPayload = `{
  "nombre": "Usuario Front",
  "email": "usuario.front@example.com",
  "password": "123456"
}`;

const defaultEditProductPayload = `{
  "nombre": "Producto actualizado desde Front",
  "descripcion": "Edición realizada desde ejemplo CRUD"
}`;

export function ApiExamplesPanel() {
  return (
    <section className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-[#141822] p-6">
      <header>
        <h2 className="text-2xl font-semibold">Ejemplos de uso API</h2>
        <p className="mt-2 text-sm text-white/70">
          Base URL activa: <span className="text-brand-orange">{getApiBaseUrl()}</span>
        </p>
      </header>
      <div className="grid gap-5 xl:grid-cols-2">
        <ListProductsExample />
        <CreateUserExample />
        <EditProductExample />
        <DeleteBidExample />
      </div>
    </section>
  );
}

function ListProductsExample() {
  const [products, setProducts] = useState<JsonRecord[]>([]);
  const { loading, error, success, run } = useApiRequest();

  async function handleList() {
    const result = await run(
      () => productosService.list(),
      "Productos consultados correctamente.",
    );
    setProducts(result);
  }

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-lg font-semibold">1) Listar productos</h3>
      <button
        type="button"
        onClick={handleList}
        disabled={loading}
        className="mt-3 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? "Consultando..." : "GET /api/productos/"}
      </button>
      <Feedback loading={loading} error={error} success={success} />
      <pre className="mt-3 max-h-52 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-white/80">
        {JSON.stringify(products.slice(0, 5), null, 2)}
      </pre>
    </article>
  );
}

function CreateUserExample() {
  const [payloadText, setPayloadText] = useState(defaultCreateUserPayload);
  const { loading, error, success, run } = useApiRequest();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = parseJson(payloadText);
      return usuariosService.create(payload);
    }, "Usuario creado correctamente.");
  }

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-lg font-semibold">2) Crear usuario</h3>
      <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
        <textarea
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          rows={7}
          className="w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm focus:border-brand-orange focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Creando..." : "POST /api/usuarios/"}
        </button>
      </form>
      <Feedback loading={loading} error={error} success={success} />
    </article>
  );
}

function EditProductExample() {
  const [productId, setProductId] = useState("");
  const [payloadText, setPayloadText] = useState(defaultEditProductPayload);
  const { loading, error, success, run } = useApiRequest();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (!productId.trim()) {
        throw new Error("Debes indicar el ID del producto.");
      }
      const payload = parseJson(payloadText);
      return productosService.partialUpdate(productId.trim(), payload);
    },
      "Producto actualizado correctamente.",
    );
  }

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-lg font-semibold">3) Editar producto</h3>
      <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="ID de producto (ej. 1)"
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
        />
        <textarea
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm focus:border-brand-orange focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "PATCH /api/productos/{id}/"}
        </button>
      </form>
      <Feedback loading={loading} error={error} success={success} />
    </article>
  );
}

function DeleteBidExample() {
  const [bidId, setBidId] = useState("");
  const { loading, error, success, run } = useApiRequest();

  async function handleDelete() {
    await run(async () => {
      if (!bidId.trim()) {
        throw new Error("Debes indicar el ID de la puja.");
      }
      return pujasService.remove(bidId.trim());
    },
      "Puja eliminada correctamente.",
    );
    setBidId("");
  }

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-lg font-semibold">4) Eliminar puja</h3>
      <div className="mt-3 flex gap-3">
        <input
          value={bidId}
          onChange={(e) => setBidId(e.target.value)}
          placeholder="ID de puja (ej. 10)"
          className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg border border-red-400/70 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-60"
        >
          {loading ? "Eliminando..." : "DELETE /api/pujas/{id}/"}
        </button>
      </div>
      <Feedback loading={loading} error={error} success={success} />
    </article>
  );
}

function Feedback({
  loading,
  error,
  success,
}: {
  loading: boolean;
  error: string;
  success: string;
}) {
  return (
    <div className="mt-3 text-sm">
      {loading && <p className="text-blue-300">Procesando solicitud...</p>}
      {error && <p className="text-red-300">{error}</p>}
      {success && <p className="text-emerald-300">{success}</p>}
    </div>
  );
}

function parseJson(text: string): JsonRecord {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("El payload debe ser un objeto JSON.");
    }
    return parsed as JsonRecord;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "JSON invalido en payload";
    throw new Error(`Payload JSON invalido: ${message}`);
  }
}
