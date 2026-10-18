/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: {
          950: '#07090e',
          900: '#090b12',
          850: '#0c0f18',
          800: '#0e121e',
          750: '#111625',
        },
        charcoal: {
          950: '#07090e',
          900: '#090b12',
          850: '#0c0f18',
          800: '#1e2638',
          700: '#334155',
          600: '#475569',
        },
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        techred: {
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
        },
        emeraldaccent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
