/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF5722",
          dark: "#0a0a0a",
          card: "#1a1a1a",
          muted: "#9ca3af",
          pill: "#2a2a2a",
          "btn-secondary": "#2d3548",
        },
        gold: {
          badge: "#d4a853",
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ['Inter', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
