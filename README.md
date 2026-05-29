# BidNow — Plataforma de Subastas en Vivo

BidNow es una aplicación web de subastas en tiempo real donde los usuarios pueden publicar artículos, realizar pujas, ganar subastas y completar compras con seguimiento de envío.

## Integrantes

| Nombre | GitHub |
|---|---|
| Sara Corrales Jaramillo | [@S-CJ8](https://github.com/S-CJ8) |
| Leidy Henao | [@LeidyHenao9](https://github.com/LeidyHenao9) |

## URL Pública

[https://front-bidnow.onrender.com](https://front-bidnow.onrender.com)

API Backend: [https://back-bidnow.onrender.com/api/docs/](https://back-bidnow.onrender.com/api/docs/)

---

## Prerrequisitos

Asegúrate de tener instalado lo siguiente antes de correr el proyecto:

- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) v9 o superior
- Git

---

## Instalación local paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/S-CJ8/Front-BidNow.git
cd Front-BidNow
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
VITE_API_BASE_URL=https://back-bidnow.onrender.com
```

> Si corres el backend localmente, cambia el valor a `http://localhost:8000`

### 4. Correr en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:5173](http://localhost:5173)

### 5. Generar build de producción

```bash
npm run build
```

### 6. Previsualizar el build

```bash
npm run preview
```

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del API backend | `https://back-bidnow.onrender.com` |

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run preview` | Previsualiza el build localmente |

---

## Funcionalidades principales

- Registro e inicio de sesión con validación de correo
- Recuperar contraseña
- Publicar artículos con imágenes para subastas
- Ver subastas en vivo con countdown en tiempo real
- Realizar pujas en tiempo real
- Finalizar subastas como propietario
- Notificación al ganar una subasta
- Flujo de compra con datos de envío y pago
- Historial de pedidos con número de seguimiento
- Mapa de calor de actividad por zonas de Medellín

## Stack tecnológico

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 5
- **Estilos**: Tailwind CSS 4
- **Iconos**: Lucide React
- **Backend**: Django REST Framework (repositorio separado)
- **Deploy**: Render

---

## Historial de trabajo colaborativo

El historial de commits refleja las contribuciones de ambos integrantes del equipo a lo largo del desarrollo del proyecto, incluyendo integración con el backend, diseño de la interfaz, funcionalidades de usuario y seguridad.

```bash
git log --oneline
```
