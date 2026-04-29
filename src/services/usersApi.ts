import { apiEndpoints } from "../config/apiEndpoints";
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

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

const MSG_CORREO_NO_REGISTRADO = "No existe un usuario registrado con ese correo.";

/** Arma sesión a partir de `usuario` y `persona` en la respuesta de `POST /api/login/`. */
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
 * `POST /api/login/` con JSON `{ "email", "password" }`.
 * El back también acepta `{ "identidad", "contrasena" }`; este formulario usa email/clave en UI y mapea a email/password.
 */
export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const email = emailOrUsername.trim().toLowerCase();
  const data = await httpClient.post<unknown>(apiEndpoints.login, {
    email,
    password,
  });
  return normalizedUserFromLoginResponse(data);
}
