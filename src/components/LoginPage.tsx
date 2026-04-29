import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { FormEvent, useState } from "react";
import { useApiRequest } from "../hooks/useApiRequest";
import { NormalizedUser, loginUser, registerUser } from "../services/usersApi";

type LoginPageProps = {
  onSuccess: (user: NormalizedUser) => void;
  onBackHome: () => void;
};

export function LoginPage({ onSuccess, onBackHome }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const { loading, error, success, run, clearMessages } = useApiRequest();

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const user = await run(
        () => loginUser(loginEmail, loginPassword),
        "Inicio de sesión exitoso.",
      );
      onSuccess(user);
    } catch {
      // El hook ya expone el mensaje de error.
    }
  }

  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await run(async () => {
        if (registerPassword !== registerConfirmPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }
        return registerUser({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        });
      }, "Usuario registrado correctamente. Ahora puedes iniciar sesión.");

      setMode("login");
      setLoginEmail(registerEmail);
      setLoginPassword("");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } catch {
      // El hook ya expone el mensaje de error.
    }
  }

  return (
    <div className="min-h-screen bg-black px-6 py-12 md:py-16">
      <div className="mx-auto flex max-w-md flex-col">
        <button
          type="button"
          onClick={onBackHome}
          className="mb-8 self-start text-sm text-white/60 transition hover:text-white"
        >
          ← Volver al inicio
        </button>

        <div className="text-center">
          <h1 className="font-sans text-2xl font-bold uppercase tracking-wide text-brand-orange md:text-3xl">
            BidNow
          </h1>
          <h2 className="mt-4 text-xl font-bold text-white md:text-2xl">
            {mode === "login" ? "Bienvenido de Nuevo" : "Crea tu cuenta"}
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            {mode === "login"
              ? "Inicia sesión para acceder a tu cuenta"
              : "Regístrate para empezar a pujar"}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-brand-card p-6 shadow-xl shadow-black/50 md:p-8">
          {mode === "login" ? (
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                    aria-hidden
                  />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                    aria-hidden
                  />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pl-11 pr-12 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted transition hover:text-white"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-brand-muted">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-brand-orange focus:ring-brand-orange"
                  />
                  Recordarme
                </label>
                <a
                  href="#"
                  className="font-medium text-brand-orange transition hover:brightness-110"
                  onClick={(e) => e.preventDefault()}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-orange py-3.5 text-center text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Validando..." : "Iniciar Sesión"}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleRegisterSubmit}>
              <div>
                <label
                  htmlFor="register-name"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Nombre
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                    aria-hidden
                  />
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                    aria-hidden
                  />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                    aria-hidden
                  />
                  <input
                    id="register-password"
                    name="password"
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pl-11 pr-12 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted transition hover:text-white"
                    aria-label={
                      showRegisterPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                    aria-hidden
                  />
                  <input
                    id="register-confirm-password"
                    name="confirm-password"
                    type={showRegisterConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pl-11 pr-12 text-sm text-white placeholder:text-brand-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted transition hover:text-white"
                    aria-label={
                      showRegisterConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showRegisterConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-orange py-3.5 text-center text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Registrando..." : "Crear Cuenta"}
              </button>
            </form>
          )}

          {(error || success) && (
            <p
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                error
                  ? "border-red-500/60 bg-red-500/10 text-red-200"
                  : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {error || success}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-brand-muted">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              className="font-semibold text-brand-orange transition hover:brightness-110"
              onClick={() => {
                clearMessages();
                setMode((prev) => (prev === "login" ? "register" : "login"));
              }}
            >
              {mode === "login" ? "Regístrate aquí" : "Inicia sesión"}
            </button>
          </p>
        </div>

        <div className="mt-6 rounded-xl border-2 border-brand-orange bg-[#1a0f0a] px-4 py-3 text-center text-sm font-medium text-brand-orange">
          💡 Si tu backend está en otra URL, define
          `FRONTEND_API_BASE_URL` en tu entorno.
        </div>
      </div>
    </div>
  );
}
