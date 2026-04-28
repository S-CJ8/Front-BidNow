import { useCallback, useState } from "react";
import { ApiError } from "../lib/httpClient";

type RequestState = {
  loading: boolean;
  error: string;
  success: string;
};

export function useApiRequest() {
  const [state, setState] = useState<RequestState>({
    loading: false,
    error: "",
    success: "",
  });

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, error: "", success: "" }));
  }, []);

  const run = useCallback(
    async <T,>(action: () => Promise<T>, successMessage?: string): Promise<T> => {
      setState({ loading: true, error: "", success: "" });
      try {
        const result = await action();
        setState({
          loading: false,
          error: "",
          success: successMessage || "",
        });
        return result;
      } catch (error) {
        const message = getApiErrorMessage(error);
        setState({
          loading: false,
          error: message,
          success: "",
        });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    run,
    clearMessages,
  };
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      const frontOrigin =
        typeof window !== "undefined" ? window.location.origin : "https://TU-FRONT.onrender.com";
      return (
        `${error.message} ` +
        `En el backend Django agrega esa URL exacta a CORS_ALLOWED_ORIGINS ` +
        `(por ejemplo: "${frontOrigin}"). ` +
        `En produccion no existe el proxy de Vite: el navegador exige CORS. ` +
        `Tambien suele hacer falta CSRF_TRUSTED_ORIGINS con la misma URL.`
      );
    }
    if (error.status >= 500) {
      return "El servidor respondió con error interno (5xx).";
    }
    if (error.status >= 400 && error.status < 500) {
      return error.message;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}
