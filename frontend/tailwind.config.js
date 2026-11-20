/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#166534',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        emerald: {
          DEFAULT: '#10B981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        charcoal: {
          DEFAULT: '#17211B',
          50: '#f4f6f5',
          100: '#e5e9e6',
          200: '#ccd4ce',
          300: '#a8b6ab',
          400: '#7e9383',
          500: '#5f7465',
          600: '#495b4f',
          700: '#3c4a41',
          800: '#323e37',
          900: '#17211B',
        },
        cream: '#F8FAF7',
        amber: {
          DEFAULT: '#F59E0B',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#F59E0B',
          600: '#D97706',
        },
        warning: '#DC2626',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'premium': '0 10px 30px -5px rgba(22, 101, 52, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
