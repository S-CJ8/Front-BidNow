import { Eye, EyeOff, Lock, Mail, User, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useApiRequest } from "../hooks/useApiRequest";
import { NormalizedUser, findUserByEmail, loginUser, registerUser, updatePassword } from "../services/usersApi";

type LoginPageProps = {
  onSuccess: (user: NormalizedUser) => void;
  onBackHome: () => void;
};

export function LoginPage({ onSuccess, onBackHome }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const { loading, error, success, run, clearMessages } = useApiRequest();

  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "newpass">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetUserId, setResetUserId] = useState<string | number | null>(null);
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetConfirmPass, setResetConfirmPass] = useState("");
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const {
    loading: resetLoading,
    error: resetError,
    success: resetSuccess,
    run: resetRun,
    clearMessages: clearReset,
  } = useApiRequest();

  function openReset() {
    setShowReset(true);
    setResetStep("email");
    setResetEmail("");
    setResetUserId(null);
    setResetNewPass("");
    setResetConfirmPass("");
    clearReset();
  }

  function closeReset() {
    setShowReset(false);
    clearReset();
  }

  async function handleResetVerifyEmail(e: FormEvent) {
    e.preventDefault();
    await resetRun(async () => {
      const found = await findUserByEmail(resetEmail.trim());
      if (!found.id) throw new Error("No se pudo identificar el usuario.");
      setResetUserId(found.id);
      setResetStep("newpass");
    }, "");
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    await resetRun(async () => {
      if (!resetNewPass.trim()) throw new Error("Ingresa la nueva contrasena.");
      if (resetNewPass !== resetConfirmPass) throw new Error("Las contrasenas no coinciden.");
      if (resetNewPass.length < 6) throw new Error("La contrasena debe tener al menos 6 caracteres.");
      if (resetUserId === null) throw new Error("Sesion expirada. Vuelve a ingresar tu correo.");
      await updatePassword(resetUserId, resetNewPass);
      setResetNewPass("");
      setResetConfirmPass("");
    }, "Contrasena actualizada correctamente. Ya puedes iniciar sesion.");
  }

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const normalizedEmail = loginEmail.trim();
      const user = await run(
        () => loginUser(normalizedEmail, loginPassword),
        "Acceso concedido.",
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
          throw new Error("Las contrasenas no coinciden.");
        }
        return registerUser({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        });
      }, "Cuenta creada. Ahora puedes iniciar sesion.");

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
    <div className="min-h-screen bg-brand-dark">
      <div className="grid min-h-screen md:grid-cols-2">
        {/* Panel izquierdo - formulario */}
        <div className="flex flex-col justify-center px-8 py-12 md:px-16">
          <button
            type="button"
            onClick={onBackHome}
            className="mb-10 self-start font-mono text-[11px] uppercase tracking-widest text-white/30"
          >
            &larr; Volver
          </button>

          <div className="mb-10">
            <p className="font-condensed text-3xl font-black uppercase tracking-widest text-brand-orange">
              BidNow
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-white/30">
              {mode === "login" ? "Terminal de Acceso" : "Registro de Cuenta"}
            </p>
          </div>

          <div className="border border-brand-border bg-brand-card p-6 md:p-8">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-widest text-white/30">
              {mode === "login" ? "Credenciales de Acceso" : "Datos del nuevo usuario"}
            </p>

            {mode === "login" ? (
              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <div>
                  <label htmlFor="login-email" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Identidad (Email)
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="usuario@correo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full border border-brand-border bg-brand-dark py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Clave de Acceso
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full border border-brand-border bg-brand-dark py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <label className="flex cursor-pointer items-center gap-2 font-mono uppercase tracking-widest text-white/30">
                    <input
                      type="checkbox"
                      name="remember"
                      className="h-3 w-3 border border-brand-border bg-brand-dark accent-brand-orange"
                    />
                    Recordar sesion
                  </label>
                  <button
                    type="button"
                    onClick={openReset}
                    className="font-mono text-[11px] uppercase tracking-widest text-brand-orange"
                  >
                    Recuperar contrasena
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {loading ? "Verificando..." : "Iniciar Sesion"}
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                <div>
                  <label htmlFor="register-name" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                    <input
                      id="register-name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      className="w-full border border-brand-border bg-brand-dark py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Correo Electronico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="usuario@correo.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="w-full border border-brand-border bg-brand-dark py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-password" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Contrasena
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                    <input
                      id="register-password"
                      name="password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full border border-brand-border bg-brand-dark py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                      aria-label={showRegisterPassword ? "Ocultar" : "Mostrar"}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-confirm-password" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Confirmar Contrasena
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                    <input
                      id="register-confirm-password"
                      name="confirm-password"
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full border border-brand-border bg-brand-dark py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                      aria-label={showRegisterConfirmPassword ? "Ocultar" : "Mostrar"}
                    >
                      {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Crear Cuenta"}
                </button>
              </form>
            )}

            {(error || success) && (
              <p className={`mt-4 border px-4 py-3 font-mono text-[11px] ${
                error
                  ? "border-red-500/40 bg-red-500/5 text-red-300"
                  : "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
              }`}>
                {error || success}
              </p>
            )}

            <p className="mt-6 font-mono text-[11px] text-white/30">
              {mode === "login" ? "¿Ya te registraste?" : "¿Ya tienes cuenta?"}{" "}
              <button
                type="button"
                className="text-brand-orange"
                onClick={() => {
                  clearMessages();
                  setMode((prev) => (prev === "login" ? "register" : "login"));
                }}
              >
                {mode === "login" ? "Registrate" : "Inicia sesion"}
              </button>
            </p>
          </div>

        </div>

        {/* Panel derecho - imagen */}
        <div
          className="hidden bg-cover bg-center md:block"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(8,8,8,1) 0%, rgba(8,8,8,0.4) 30%, rgba(8,8,8,0.1) 100%), url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu1qgHraD1FtM2lLjsrV7rCDCru1WhQmTS_g&s)",
          }}
        />
      </div>

      {/* Modal recuperar contrasena */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-sm border border-brand-border bg-brand-dark">

            {/* Cabecera del modal */}
            <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-brand-orange">
                  Seguridad
                </p>
                <p className="mt-0.5 font-condensed text-lg font-black uppercase tracking-widest text-white">
                  Recuperar Contraseña
                </p>
              </div>
              <button
                type="button"
                onClick={closeReset}
                className="text-white/30"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {/* PASO 1 — verificar correo */}
              {resetStep === "email" && (
                <form onSubmit={handleResetVerifyEmail} className="space-y-4">
                  <p className="font-mono text-[11px] text-white/40">
                    Ingresa el correo asociado a tu cuenta. Si existe, podras cambiar tu contraseña.
                  </p>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Correo Electronico
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); clearReset(); }}
                        placeholder="usuario@correo.com"
                        className="w-full border border-brand-border bg-black py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </div>

                  {resetError && (
                    <p className="border border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-[11px] text-red-300">
                      {resetError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-brand-orange py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    {resetLoading ? "Verificando..." : "Verificar Correo"}
                  </button>
                </form>
              )}

              {/* PASO 2 — nueva contrasena */}
              {resetStep === "newpass" && (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                      Correo verificado
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-white/40">{resetEmail}</p>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Nueva Contrasena
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                      <input
                        type={showResetPass ? "text" : "password"}
                        required
                        minLength={6}
                        value={resetNewPass}
                        onChange={(e) => { setResetNewPass(e.target.value); clearReset(); }}
                        placeholder="••••••••"
                        className="w-full border border-brand-border bg-black py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                      >
                        {showResetPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Confirmar Contrasena
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" aria-hidden />
                      <input
                        type={showResetConfirm ? "text" : "password"}
                        required
                        minLength={6}
                        value={resetConfirmPass}
                        onChange={(e) => { setResetConfirmPass(e.target.value); clearReset(); }}
                        placeholder="••••••••"
                        className="w-full border border-brand-border bg-black py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 focus:border-brand-orange focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                      >
                        {showResetConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {resetError && (
                    <p className="border border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-[11px] text-red-300">
                      {resetError}
                    </p>
                  )}

                  {resetSuccess && (
                    <p className="border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 font-mono text-[11px] text-emerald-300">
                      {resetSuccess}
                    </p>
                  )}

                  {!resetSuccess && (
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full bg-brand-orange py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {resetLoading ? "Guardando..." : "Cambiar Contrasena"}
                    </button>
                  )}

                  {resetSuccess && (
                    <button
                      type="button"
                      onClick={closeReset}
                      className="w-full border border-brand-border py-2.5 font-mono text-[11px] uppercase tracking-widest text-white/50"
                    >
                      Cerrar e Iniciar Sesion
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setResetStep("email"); clearReset(); }}
                    className="w-full font-mono text-[10px] uppercase tracking-widest text-white/20"
                  >
                    Usar otro correo
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
