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

function extractList(response: unknown): ApiRecord[] {
  if (Array.isArray(response)) {
    return response as ApiRecord[];
  }
  if (response && typeof response === "object") {
    const r = response as Record<string, unknown>;
    if (Array.isArray(r.results)) {
      return r.results as ApiRecord[];
    }
    if (Array.isArray(r.data)) {
      return r.data as ApiRecord[];
    }
  }
  return [];
}

function personaMatchesEmail(p: ApiRecord, normalizedEmail: string): boolean {
  const mail = toText(p.email).toLowerCase();
  const corr = toText(p.correo).toLowerCase();
  return mail === normalizedEmail || corr === normalizedEmail;
}

/** Une resultados de ?email= y ?correo= (misma persona puede aparecer en uno u otro filtro). */
async function fetchPersonasByEmail(normalizedEmail: string): Promise<ApiRecord[]> {
  const byPk = new Map<string, ApiRecord>();
  for (const filter of ["email", "correo"] as const) {
    try {
      const res = await httpClient.get<unknown>(personasListUrl(filter, normalizedEmail));
      for (const p of extractList(res)) {
        const pk = p.id ?? p.pk;
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
  return [...byPk.values()];
}

/** PK de persona enlazada a `usuario.id_persona` (en Django suele ser `persona.id`). */
function getPersonaPk(persona: ApiRecord): string | number | null {
  const pk = persona.id ?? persona.pk;
  if (pk !== undefined && pk !== null && pk !== "") {
    return pk as string | number;
  }
  return null;
}

/**
 * Busca filas de usuario enlazadas a esta persona: primero `id_persona`, luego `email` / `correo`
 * y se filtra siempre por FK hacia la persona.
 */
async function fetchUsuarioForPersona(
  personaPk: string | number,
  normalizedEmail: string,
): Promise<ApiRecord | null> {
  const attempts = [
    usuariosListUrl("id_persona", personaPk),
    usuariosListUrl("email", normalizedEmail),
    usuariosListUrl("correo", normalizedEmail),
  ];

  for (const url of attempts) {
    try {
      const res = await httpClient.get<unknown>(url);
      const list = extractList(res);
      const linked = list.filter(
        (u) => String(u.id_persona ?? u.persona ?? "") === String(personaPk),
      );
      if (linked.length >= 1) {
        return linked[0];
      }
      if (url.includes("id_persona") && list.length === 1) {
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
    toText(usuario.email) ||
    toText(usuario.correo);

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
 * Login vía GET: listar persona por email/correo, luego usuario por id_persona (y respaldos email/correo en listado),
 * comparar `contrasena` en el front. Mensajes de error los arma solo el front.
 */
export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const normalizedEmail = emailOrUsername.trim().toLowerCase();

  const personas = await fetchPersonasByEmail(normalizedEmail);
  if (personas.length === 0) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const personaMatch = personas.find((p) => personaMatchesEmail(p, normalizedEmail));
  const persona =
    personaMatch ?? (personas.length === 1 ? personas[0] : null);
  if (!persona) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const personaPk = getPersonaPk(persona);
  if (personaPk === null) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const usuario = await fetchUsuarioForPersona(personaPk, normalizedEmail);
  if (!usuario) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const storedPlain = toText(usuario.contrasena);
  if (!storedPlain) {
    throw new Error(MSG_CONTRASENA_INCORRECTA);
  }
  if (storedPlain !== password) {
    throw new Error(MSG_CONTRASENA_INCORRECTA);
  }

  return normalizedUserFromLoginResponse({ usuario, persona });
}
