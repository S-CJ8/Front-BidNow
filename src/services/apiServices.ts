import { httpClient } from "../lib/httpClient";

export type ApiRecord = Record<string, unknown>;
export type ApiListResponse<T extends ApiRecord> =
  | T[]
  | {
      count?: number;
      next?: string | null;
      previous?: string | null;
      results?: T[];
      data?: T[];
    };

type ResourceConfig = {
  listPath: string;
  detailPath: (id: string | number) => string;
};

function extractList<T extends ApiRecord>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response.results)) {
    return response.results;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

function createCrudService<T extends ApiRecord>(config: ResourceConfig) {
  return {
    async list(): Promise<T[]> {
      const response = await httpClient.get<ApiListResponse<T>>(config.listPath);
      return extractList(response);
    },
    detail(id: string | number): Promise<T> {
      return httpClient.get<T>(config.detailPath(id));
    },
    create(payload: Partial<T>): Promise<T> {
      return httpClient.post<T>(config.listPath, payload);
    },
    update(id: string | number, payload: Partial<T>): Promise<T> {
      return httpClient.put<T>(config.detailPath(id), payload);
    },
    partialUpdate(id: string | number, payload: Partial<T>): Promise<T> {
      return httpClient.patch<T>(config.detailPath(id), payload);
    },
    remove(id: string | number): Promise<unknown> {
      return httpClient.delete<unknown>(config.detailPath(id));
    },
  };
}

export const usuariosService = createCrudService<ApiRecord>({
  listPath: "/api/usuarios/",
  detailPath: (id) => `/api/usuarios/${id}/`,
});

export const metodosPagoService = createCrudService<ApiRecord>({
  listPath: "/api/metodos-pago/",
  detailPath: (id) => `/api/metodos-pago/${id}/`,
});

export const productosService = createCrudService<ApiRecord>({
  listPath: "/api/productos/",
  detailPath: (id) => `/api/productos/${id}/`,
});

export const subastasService = createCrudService<ApiRecord>({
  listPath: "/api/subastas/",
  detailPath: (id) => `/api/subastas/${id}/`,
});

export const pujasService = createCrudService<ApiRecord>({
  listPath: "/api/pujas/",
  detailPath: (id) => `/api/pujas/${id}/`,
});

export const transaccionesService = createCrudService<ApiRecord>({
  listPath: "/api/transacciones/",
  detailPath: (id) => `/api/transacciones/${id}/`,
});
