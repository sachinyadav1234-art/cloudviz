/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0A0E14",
          900: "#0F1520",
          850: "#131A27",
          800: "#182233",
          700: "#25324A",
          600: "#3A4D6B",
          500: "#5B7196",
          400: "#8CA0BC",
          300: "#B7C4D8",
          100: "#E8EDF5"
        },
        signal: {
          cyan: "#3FD4C8",
          amber: "#F0A84E",
          red: "#EF5B5B",
          violet: "#8B7FE8"
        }
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(63,212,200,0.15), 0 8px 24px -8px rgba(63,212,200,0.25)"
      }
    }
  },
  plugins: []
};
