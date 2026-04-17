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

function looksHashedPassword(value: string): boolean {
  return value.length >= 20 || value.includes("$") || /^[a-f0-9]{32,}$/i.test(value);
}

export async function registerUser(input: RegisterInput): Promise<void> {
  const payloadCandidates: Record<string, unknown>[] = [
    { nombre: input.name, email: input.email, password: input.password },
    { username: input.name, email: input.email, password: input.password },
    {
      nombre_usuario: input.name,
      correo: input.email,
      contrasena: input.password,
    },
    {
      nombre_usuario: input.name,
      email: input.email,
      password: input.password,
    },
  ];

  let lastError: Error | null = null;
  for (const payload of payloadCandidates) {
    try {
      await usuariosService.create(payload);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Error desconocido");
    }
  }
  throw (
    lastError ||
    new Error("No fue posible crear el usuario con los formatos soportados.")
  );
}

export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<NormalizedUser> {
  const users = await usuariosService.list();
  const normalizedInput = emailOrUsername.trim().toLowerCase();

  const selected = users
    .map(normalizeUser)
    .filter((user): user is NormalizedUser => Boolean(user))
    .find((user) => user.email.trim().toLowerCase() === normalizedInput);

  if (!selected) {
    throw new Error("No existe un usuario registrado con ese correo.");
  }

  if (
    selected.password &&
    !looksHashedPassword(selected.password) &&
    selected.password !== password
  ) {
    throw new Error("Contraseña incorrecta.");
  }

  return selected;
}
