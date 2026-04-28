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
    <div className="relative min-h-screen overflow-hidden bg-[#060606] px-6 py-10 md:py-14">
      <div
        className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,140,0,0.12),rgba(255,140,0,0)_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-28 top-20 h-64 w-64 rounded-full border border-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),rgba(255,255,255,0)_70%)]"
        aria-hidden
      />
      <div className="mx-auto flex max-w-md flex-col">
        <button
          type="button"
          onClick={onBackHome}
          className="mb-6 self-start text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          ← Volver al inicio
        </button>

        <div className="text-left">
          <h1 className="font-sans text-xl font-bold uppercase tracking-[0.25em] text-brand-orange md:text-2xl">
            BidNow
          </h1>
        </div>

        <div className="mt-8 rounded-sm border border-white/10 bg-[#121418]/95 p-6 shadow-2xl shadow-black/60 md:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold uppercase tracking-wide text-white">
              {mode === "login" ? "Acceso BidNow" : "Crear cuenta BidNow"}
            </h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
              {mode === "login"
                ? "Verifique sus credenciales"
                : "Complete sus datos para registrarse"}
            </p>
          </div>
          {mode === "login" ? (
            <form className="mt-7 space-y-5" onSubmit={handleLoginSubmit}>
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/65"
                >
                  Identidad (Email)
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
                    placeholder="correo@ejemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full rounded-none border border-white/10 bg-[#1a1d23] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-orange focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/65"
                >
                  Clave de seguridad
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
                    className="w-full rounded-none border border-white/10 bg-[#1a1d23] py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:border-brand-orange focus:outline-none focus:ring-0"
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

              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-orange transition hover:brightness-110"
                  onClick={(e) => e.preventDefault()}
                >
                  ¿Olvidaste tu clave?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange py-3.5 text-center text-sm font-black uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Validando..." : "Ingresar"}
              </button>
            </form>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={handleRegisterSubmit}>
              <div>
                <label
                  htmlFor="register-name"
                  className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/65"
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
                    className="w-full rounded-none border border-white/10 bg-[#1a1d23] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-orange focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/65"
                >
                  Identidad (Email)
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
                    className="w-full rounded-none border border-white/10 bg-[#1a1d23] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-orange focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/65"
                >
                  Clave de seguridad
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
                    className="w-full rounded-none border border-white/10 bg-[#1a1d23] py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:border-brand-orange focus:outline-none focus:ring-0"
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
                  className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-white/65"
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
                    className="w-full rounded-none border border-white/10 bg-[#1a1d23] py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:border-brand-orange focus:outline-none focus:ring-0"
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
                className="w-full bg-brand-orange py-3.5 text-center text-sm font-black uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          )}

          {(error || success) && (
            <p
              className={`mt-4 border px-4 py-3 text-sm ${
                error
                  ? "border-red-500/60 bg-red-500/10 text-red-200"
                  : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {error || success}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-brand-muted">
            {mode === "login"
              ? "¿Nueva en BidNow Trading?"
              : "¿Ya tienes cuenta en BidNow?"}{" "}
            <button
              type="button"
              className="border border-white/35 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:border-brand-orange hover:text-brand-orange"
              onClick={() => {
                clearMessages();
                setMode((prev) => (prev === "login" ? "register" : "login"));
              }}
            >
              {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </p>
        </div>

        <div className="mt-6 border border-brand-orange/70 bg-[#1a0f0a] px-4 py-3 text-center text-xs font-medium text-brand-orange">
          Si tu backend está en otra URL, define
          `FRONTEND_API_BASE_URL` en tu entorno.
        </div>
      </div>
    </div>
  );
}
