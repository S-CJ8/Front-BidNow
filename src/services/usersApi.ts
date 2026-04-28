import { httpClient } from "../lib/httpClient";

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

/**
 * Arma sesión a partir de objetos `usuario` y `persona` (misma forma que POST /api/login/).
 */
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
    throw new Error(
      "La respuesta del login no incluye correo en persona ni en usuario.",
    );
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
 * Login vía GET (flujo pedido explícitamente): persona por email → usuario por id_persona → comparar contraseña en front.
 */
export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const normalizedEmail = emailOrUsername.trim().toLowerCase();
  const q = encodeURIComponent(normalizedEmail);

  const personasRes = await httpClient.get<unknown>(`/api/personas/?email=${q}`);
  const personas = extractList(personasRes);
  const persona =
    personas.find(
      (p) =>
        toText(p.email).toLowerCase() === normalizedEmail ||
        toText(p.correo).toLowerCase() === normalizedEmail,
    ) ?? personas[0];

  if (!persona) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }

  const idPersona =
    persona.id_persona ?? persona.id ?? persona.pk ?? persona.idPersona;
  if (idPersona === undefined || idPersona === null || idPersona === "") {
    throw new Error("No se pudo obtener id_persona para esta persona.");
  }

  const usuariosRes = await httpClient.get<unknown>(
    `/api/usuarios/?id_persona=${encodeURIComponent(String(idPersona))}`,
  );
  const usuarios = extractList(usuariosRes);
  const usuario =
    usuarios.find((u) => String(u.id_persona ?? u.persona) === String(idPersona)) ??
    usuarios[0];

  if (!usuario) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }

  const storedSecret =
    toText(usuario.contrasena) ||
    toText(usuario.password) ||
    toText(usuario["contraseña"]);

  if (storedSecret !== password) {
    throw new Error("La contraseña no es correcta.");
  }

  return normalizedUserFromLoginResponse({ usuario, persona });
}
