import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { NormalizedUser } from "./services/usersApi";

const { sessionUser } = vi.hoisted(() => {
  const user: NormalizedUser = {
    id: 1,
    name: "Usuario Prueba",
    email: "prueba@test.com",
    raw: {
      usuario: { id: 1, contrasena: "x" },
      persona: { id: 2, correo: "prueba@test.com", nombre: "Usuario Prueba" },
    },
  };
  return { sessionUser: user };
});

vi.mock("./services/usersApi", () => ({
  loginUser: vi.fn().mockResolvedValue(sessionUser),
  registerUser: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ results: [] }),
  } as unknown as Response);
});

describe("Navegación tras iniciar sesión", () => {
  it("pasa de la pantalla de login al dashboard (Trader Terminal)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await user.type(
      screen.getByLabelText(/identidad \(email\)/i),
      "prueba@test.com",
    );
    await user.type(screen.getByLabelText(/clave de seguridad/i), "miClave123");

    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/trader terminal/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/bidnow pro account/i)).toBeInTheDocument();
  });
});
