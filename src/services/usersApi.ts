import { httpClient } from "../lib/httpClient";

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
  const persona = await httpClient.post<Record<string, unknown>>("/api/personas/", {
    nombre: input.name.trim(),
    correo: normalizedEmail,
    email: normalizedEmail,
  });

  const idPersona =
    persona.id_persona ?? persona.id ?? persona.pk ?? persona.idPersona;
  if (idPersona === undefined || idPersona === null || String(idPersona).trim() === "") {
    throw new Error("No se pudo crear la persona para registrar el usuario.");
  }

  await httpClient.post("/api/usuarios/", {
    id_persona: idPersona,
    contrasena: input.password,
  });
}

export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const normalizedInput = emailOrUsername.trim().toLowerCase();
  const personasRaw = await httpClient.get<unknown>(
    `/api/personas/?search=${encodeURIComponent(normalizedInput)}`,
  );
  const personas = extractList(personasRaw);
  if (personas.length === 0) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }

  const persona = personas[0];
  const idPersona =
    persona.id_persona ?? persona.id ?? persona.pk ?? persona.idPersona;
  if (idPersona === undefined || idPersona === null || String(idPersona).trim() === "") {
    throw new Error("No existe un usuario registrado con ese correo.");
  }

  const usuariosRaw = await httpClient.get<unknown>(
    `/api/usuarios/?search=${encodeURIComponent(String(idPersona))}`,
  );
  const usuarios = extractList(usuariosRaw);
  if (usuarios.length === 0) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }

  const usuario =
    usuarios.find(
      (u) =>
        String(u.id_persona ?? u.persona ?? "").trim() === String(idPersona).trim(),
    ) ?? usuarios[0];

  const storedPassword =
    toText(usuario.contrasena) ||
    toText(usuario.password) ||
    toText(usuario["contraseña"]);

  if (storedPassword !== password) {
    throw new Error("La contraseña no es correcta.");
  }

  return (
    normalizeUser({
      ...usuario,
      ...persona,
      email: toText(persona.correo) || toText(persona.email) || normalizedInput,
      correo: toText(persona.correo) || toText(persona.email) || normalizedInput,
    }) || {
      id: typeof idPersona === "number" || typeof idPersona === "string" ? idPersona : undefined,
      name: toText(persona.nombre) || "Usuario",
      email: toText(persona.correo) || toText(persona.email) || normalizedInput,
      raw: { usuario, persona },
    }
  );
}
