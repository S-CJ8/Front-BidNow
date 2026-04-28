import { httpClient } from "../lib/httpClient";

export type NormalizedUser = {
  id?: number | string;
  name: string;
  email: string;
  password?: string;
  /** Respuesta de login: modelo usuario (DRF). */
  raw: Record<string, unknown>;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

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
 * POST /api/login/ → { usuario, persona }
 * Estado de sesión: datos combinados para que el dashboard siga leyendo id / nombre / correo.
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

export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const trimmed = emailOrUsername.trim();
  const data = await httpClient.post<unknown>("/api/login/", {
    email: trimmed,
    password,
  });
  return normalizedUserFromLoginResponse(data);
}
