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

/** Mensajes fijos del front (el back ya no devuelve estos textos en JSON de error para este flujo). */
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
  await httpClient.post("/api/registro/", {
    nombre: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
  });
}

/**
 * Login vía GET: persona por email → usuario por id_persona → comparar contraseña en front.
 * Los textos de error los arma solo el front según listas vacías o coincidencia de contrasena.
 */
export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const normalizedEmail = emailOrUsername.trim().toLowerCase();
  const q = encodeURIComponent(normalizedEmail);

  let personasRes: unknown;
  try {
    personasRes = await httpClient.get<unknown>(`/api/personas/?email=${q}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      throw error;
    }
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const personas = extractList(personasRes);
  if (personas.length === 0) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const personaMatch = personas.find(
    (p) =>
      toText(p.email).toLowerCase() === normalizedEmail ||
      toText(p.correo).toLowerCase() === normalizedEmail,
  );
  const persona = personaMatch ?? (personas.length === 1 ? personas[0] : null);
  if (!persona) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const idPersona =
    persona.id_persona ?? persona.id ?? persona.pk ?? persona.idPersona;
  if (idPersona === undefined || idPersona === null || idPersona === "") {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  let usuariosRes: unknown;
  try {
    usuariosRes = await httpClient.get<unknown>(
      `/api/usuarios/?id_persona=${encodeURIComponent(String(idPersona))}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      throw error;
    }
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const usuarios = extractList(usuariosRes);
  if (usuarios.length === 0) {
    throw new Error(MSG_CORREO_NO_REGISTRADO);
  }

  const usuario =
    usuarios.find((u) => String(u.id_persona ?? u.persona) === String(idPersona)) ??
    (usuarios.length === 1 ? usuarios[0] : null);

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
