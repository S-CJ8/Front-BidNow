/**
 * Rutas del API Django (DRF). Base del API (ej. `https://back-bidnow.onrender.com/api`):
 * `VITE_API_BASE_URL`, `FRONTEND_API_BASE_URL` o `REACT_APP_API_URL` en `httpClient`.
 *
 * Patrón CRUD por recurso: GET|POST /api/<recurso>/ y GET|PUT|PATCH|DELETE /api/<recurso>/{pk}/
 */

export const apiEndpoints = {
  /** Auth fuera del router de recursos */
  registro: "/api/registro/",
  login: "/api/login/",

  /** Listados con filtros opcionales documentados en el back */
  personas: "/api/personas/",
  usuarios: "/api/usuarios/",

  roles: "/api/roles/",
  empleados: "/api/empleados/",
  casos: "/api/casos/",
  alertas: "/api/alertas/",
  carpetas: "/api/carpetas/",
  documentos: "/api/documentos/",
  seguimientos: "/api/seguimientos/",
  reportes: "/api/reportes/",
  comentarios: "/api/comentarios/",
  auditoriasDocumento: "/api/auditorias-documento/",
  casoReportes: "/api/caso-reportes/",
  casoUsuarios: "/api/caso-usuarios/",

  /** Utilidades / docs (no usadas aún en el front de subastas) */
  schema: "/api/schema/",
  docs: "/api/docs/",
} as const;

/** Filtros soportados en GET list de personas (mismo criterio trim + minúsculas en BD). */
export type PersonaListFilter = "email" | "correo" | "identidad";

export function personasListUrl(filter: PersonaListFilter, value: string): string {
  const v = encodeURIComponent(value);
  return `${apiEndpoints.personas}?${filter}=${v}`;
}

/** Filtros soportados en GET list de usuarios (email, correo e identidad equivalentes en el back). */
export type UsuarioListFilter = "id_persona" | "email" | "correo" | "identidad";

export function usuariosListUrl(filter: UsuarioListFilter, value: string | number): string {
  const v = encodeURIComponent(String(value).trim());
  return `${apiEndpoints.usuarios}?${filter}=${v}`;
}
