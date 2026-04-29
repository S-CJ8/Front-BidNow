import { apiEndpoints, personasListUrl, usuariosListUrl } from "../config/apiEndpoints";
import { ApiError, httpClient } from "../lib/httpClient";

export type NormalizedUser = {
  id?: number | string;
  name: string;
  email: string;
  password?: string;
  /** Modelo usuario + persona combinados tras login. */
  raw: Record<string, unknown>;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type ApiRecord = Record<string, unknown>;

/** Mensajes fijos del front para el flujo GET (el back no devuelve estos textos en JSON de error). */
const MSG_CORREO_NO_REGISTRADO = "No existe un usuario registrado con ese correo.";
const MSG_CONTRASENA_INCORRECTA = "La contraseña no es correcta.";

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Normaliza listados DRF, envoltorios `value`/`Value` (p. ej. .NET) y objeto único.
 * Persona suelta puede venir solo con `id_persona` (sin `id`/`pk`).
 */
function extractList(response: unknown): ApiRecord[] {
  if (Array.isArray(response)) {
    return response as ApiRecord[];
  }
  if (!response || typeof response !== "object") {
    return [];
  }
  const r = response as Record<string, unknown>;
  if (Array.isArray(r.results)) {
    return r.results as ApiRecord[];
  }
  if (Array.isArray(r.data)) {
    return r.data as ApiRecord[];
  }
  for (const key of [
    "value",
    "Value",
    "personas",
    "usuarios",
    "items",
    "Items",
    "records",
  ]) {
    if (Array.isArray(r[key])) {
      return r[key] as ApiRecord[];
    }
  }
  if (
    r.id !== undefined ||
    r.pk !== undefined ||
    r.id_persona !== undefined ||
    r.id_usuario !== undefined
  ) {
    return [r as ApiRecord];
  }
  return [];
}

function personaMatchesIdentity(p: ApiRecord, normalizedEmail: string): boolean {
  const mail = toText(p.email).toLowerCase();
  const corr = toText(p.correo).toLowerCase();
  const idn = toText(p.identidad).toLowerCase();
  return (
    mail === normalizedEmail ||
    corr === normalizedEmail ||
    idn === normalizedEmail
  );
}

/** Valores a probar en query (?email=, etc.): minúsculas y tal cual el usuario escribió (trim). */
function emailQueryVariants(rawTrimmed: string): string[] {
  const lower = rawTrimmed.toLowerCase();
  return lower === rawTrimmed ? [lower] : [lower, rawTrimmed];
}

/** Une resultados de ?email=, ?correo= e ?identidad= con variantes de mayúsculas. */
async function fetchPersonasByEmail(rawTrimmed: string): Promise<ApiRecord[]> {
  const byPk = new Map<string, ApiRecord>();
  const variants = emailQueryVariants(rawTrimmed);

  for (const value of variants) {
    for (const filter of ["email", "correo", "identidad"] as const) {
      try {
        const res = await httpClient.get<unknown>(personasListUrl(filter, value));
        for (const p of extractList(res)) {
          const pk = p.id ?? p.pk ?? p.id_persona;
          if (pk !== undefined && pk !== null && pk !== "") {
            byPk.set(String(pk), p);
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 0) {
          throw error;
        }
      }
    }
  }
  return [...byPk.values()];
}

/** PK de persona para `GET /api/usuarios/?id_persona=` (`id`, `pk` o `id_persona` según serializer). */
function getPersonaPk(persona: ApiRecord): string | number | null {
  const pk = persona.id ?? persona.pk ?? persona.id_persona;
  if (pk !== undefined && pk !== null && pk !== "") {
    return pk as string | number;
  }
  return null;
}

function usuarioLinkedToPersonaPk(u: ApiRecord, personaPk: string | number): boolean {
  const target = String(personaPk);
  const flat = [u.id_persona, u.persona_id, u.idPersona];
  for (const c of flat) {
    if (c !== undefined && c !== null && String(c) === target) {
      return true;
    }
  }
  const nested = u.persona;
  if (nested === undefined || nested === null) {
    return false;
  }
  if (typeof nested === "object" && !Array.isArray(nested)) {
    const p = nested as ApiRecord;
    const id = p.id ?? p.pk ?? p.id_persona;
    if (id !== undefined && id !== null && String(id) === target) {
      return true;
    }
    return false;
  }
  return String(nested) === target;
}

function isUsuarioFilteredByIdentityUrl(url: string): boolean {
  return /[?](email|correo|identidad)=/.test(url);
}

/**
 * Busca usuario: por `id_persona`, luego por filtros de correo/identidad.
 * Si el back devuelve **una sola** fila en un listado ya filtrado por correo, se acepta aunque no venga `id_persona` en el JSON.
 */
async function fetchUsuarioForPersona(
  personaPk: string | number,
  rawTrimmedEmail: string,
): Promise<ApiRecord | null> {
  const variants = emailQueryVariants(rawTrimmedEmail);
  const attempts: string[] = [usuariosListUrl("id_persona", personaPk)];
  for (const v of variants) {
    attempts.push(
      usuariosListUrl("email", v),
      usuariosListUrl("correo", v),
      usuariosListUrl("identidad", v),
    );
  }

  for (const url of attempts) {
    try {
      const res = await httpClient.get<unknown>(url);
      const list = extractList(res);
      const linked = list.filter((u) => usuarioLinkedToPersonaPk(u, personaPk));
      if (linked.length >= 1) {
        return linked[0];
      }
      if (url.includes("id_persona") && list.length === 1) {
        return list[0];
      }
      if (isUsuarioFilteredByIdentityUrl(url) && list.length === 1) {
        return list[0];
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        throw error;
      }
    }
  }
  return null;
}

/** Arma sesión a partir de objetos `usuario` y `persona` anidados en `raw`. */
export function normalizedUserFromLoginResponse(data: unknown): NormalizedUser {
  const root = asRecord(data);
  const usuario = asRecord(root?.usuario) ?? {};
  const persona = asRecord(root?.persona) ?? {};

  const id = usuario.id ?? usuario.id_usuario ?? usuario.pk;
  const name =
    toText(persona.nombre) ||
    toText(persona.nombres) ||
    toText(usuario.nombre) ||
    "Usuario";
  const email =
    toText(persona.correo) ||
    toText(persona.email) ||
    toText(persona.identidad) ||
    toText(usuario.email) ||
    toText(usuario.correo) ||
    toText(usuario.identidad);

  if (!email) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const raw: Record<string, unknown> = {
    ...persona,
    ...usuario,
    usuario,
    persona,
  };

  return {
    id: typeof id === "number" || typeof id === "string" ? id : undefined,
    name,
    email,
    raw,
  };
}

export async function registerUser(input: RegisterInput): Promise<void> {
  await httpClient.post(apiEndpoints.registro, {
    nombre: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
  });
}

/**
 * Login vía GET: persona → usuario → comparar `contrasena` en el front.
 */
export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const rawTrimmed = emailOrUsername.trim();
  const normalizedEmail = rawTrimmed.toLowerCase();

  const personas = await fetchPersonasByEmail(rawTrimmed);
  if (personas.length === 0) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const personaMatch = personas.find((p) => personaMatchesIdentity(p, normalizedEmail));
  const persona =
    personaMatch ?? (personas.length === 1 ? personas[0] : null);
  if (!persona) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const personaPk = getPersonaPk(persona);
  if (personaPk === null) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const usuario = await fetchUsuarioForPersona(personaPk, rawTrimmed);
  if (!usuario) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const storedPlain = toText(usuario.contrasena).trim();
  const passwordTrimmed = password.trim();
  if (!storedPlain) {
    throw new Error(MSG_CONTRASENA_INCORRECTA);
  }
  if (storedPlain !== passwordTrimmed) {
    throw new Error(MSG_CONTRASENA_INCORRECTA);
  }

  return normalizedUserFromLoginResponse({ usuario, persona });
}
