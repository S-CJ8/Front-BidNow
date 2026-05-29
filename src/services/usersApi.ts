import { httpClient } from "../lib/httpClient";
import { usuariosService } from "./apiServices";

export type NormalizedUser = {
  id?: number | string;
  name: string;
  email: string;
  password?: string;
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

function normalizeUser(raw: unknown): NormalizedUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const id = record.id ?? record.id_usuario;
  const name =
    toText(record.nombre) ||
    toText(record.nombre_usuario) ||
    toText(record.username) ||
    toText(record.name) ||
    toText(record.nombres);
  const email = toText(record.email) || toText(record.correo);
  const password =
    toText(record.password) ||
    toText(record.contrasena) ||
    toText(record["contraseña"]);

  if (!email) {
    return null;
  }
  return {
    id: typeof id === "number" || typeof id === "string" ? id : undefined,
    name: name || "Usuario",
    email,
    password: password || undefined,
    raw: record,
  };
}

function extractList(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) {
    return raw as Array<Record<string, unknown>>;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }
  const data = raw as Record<string, unknown>;
  if (Array.isArray(data.results)) {
    return data.results as Array<Record<string, unknown>>;
  }
  if (Array.isArray(data.data)) {
    return data.data as Array<Record<string, unknown>>;
  }
  if (Array.isArray(data.value)) {
    return data.value as Array<Record<string, unknown>>;
  }
  if (
    data.id !== undefined ||
    data.pk !== undefined ||
    data.id_persona !== undefined ||
    data.id_usuario !== undefined
  ) {
    return [data];
  }
  return [];
}

export async function registerUser(input: RegisterInput): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await httpClient.get<unknown>(
    `/api/usuarios/?search=${encodeURIComponent(normalizedEmail)}`,
  );
  const list = extractList(existing);
  const alreadyExists = list.some((u) => {
    const email = toText(u.correo) || toText(u.email);
    return email.trim().toLowerCase() === normalizedEmail;
  });

  if (alreadyExists) {
    throw new Error("Este correo ya esta registrado. Inicia sesion con tu cuenta existente.");
  }

  await usuariosService.create({
    nombre: input.name.trim(),
    correo: normalizedEmail,
    contrasena: input.password,
  });
}

export async function findUserByEmail(email: string): Promise<NormalizedUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const raw = await httpClient.get<unknown>(
    `/api/usuarios/?search=${encodeURIComponent(normalizedEmail)}`,
  );
  const list = extractList(raw);
  const match = list.find((u) => {
    const e = toText(u.correo) || toText(u.email);
    return e.trim().toLowerCase() === normalizedEmail;
  });
  if (!match) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }
  const normalized = normalizeUser(match);
  if (!normalized) {
    throw new Error("No se pudo leer los datos del usuario.");
  }
  return normalized;
}

export async function updatePassword(
  userId: string | number,
  newPassword: string,
): Promise<void> {
  await usuariosService.partialUpdate(userId, { contrasena: newPassword });
}

export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const normalizedInput = emailOrUsername.trim().toLowerCase();
  const usuariosRaw = await httpClient.get<unknown>(
    `/api/usuarios/?search=${encodeURIComponent(normalizedInput)}`,
  );
  const usuarios = extractList(usuariosRaw);

  const firstUserRaw = usuarios[0];
  if (!firstUserRaw) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }

  const storedPassword = toText(
    (firstUserRaw as Record<string, unknown>).contrasena,
  );
  if (storedPassword !== password) {
    throw new Error("La contraseña no es correcta.");
  }

  const normalized = normalizeUser(firstUserRaw);
  if (!normalized) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }
  normalized.email = normalizedInput;
  return normalized;
}
