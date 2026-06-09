/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MedCore Clinic teal brand
        brand: {
          50:  '#e6f4f4',
          100: '#c0e4e4',
          200: '#8ecece',
          300: '#55b5b5',
          400: '#2aa0a0',
          500: '#1a8c8c',
          600: '#157878',
          700: '#0f6262',
          800: '#0a4e4e',
          900: '#063838',
          950: '#031e1e',
        },
        // Nav dark teal
        nav: {
          DEFAULT: '#1a5c5c',
          dark: '#144a4a',
          light: '#206e6e',
        },
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
        },
        accent: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
        },
        medical: {
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488',
        },
        surface: {
          50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5',
          700: '#1a1a2e', 800: '#16162a', 900: '#0f0f1a', 950: '#0a0a12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'nav':     '0 2px 12px rgba(0,0,0,0.15)',
        'card':    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10)',
        'glass':   '0 4px 24px -1px rgba(0,0,0,0.08)',
        'neon-teal': '0 0 20px rgba(26,140,140,0.25)',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in':   'fadeIn 0.3s ease-out both',
        'slide-in':  'slideIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in':  'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.6s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.4)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
