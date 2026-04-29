/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base del API, ej. `https://back-bidnow.onrender.com/api` */
  readonly VITE_API_BASE_URL?: string;
  readonly FRONTEND_API_BASE_URL?: string;
  readonly REACT_APP_API_URL?: string;
}
