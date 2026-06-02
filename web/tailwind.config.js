/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
        'glass': '0 4px 24px -1px rgba(0,0,0,0.3), 0 2px 8px -1px rgba(0,0,0,0.2)',
        'glass-lg': '0 20px 40px -8px rgba(0,0,0,0.4)',
        'card': '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
        'neon-indigo': '0 0 20px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.08)',
        'neon-cyan': '0 0 20px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.08)',
        'neon-emerald': '0 0 20px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.08)',
        'neon-purple': '0 0 20px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.08)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in': 'slideIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'gradient': 'gradient 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'orb': 'orbFloat 12s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.4)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(20px, -30px) scale(1.1)' },
          '50%': { transform: 'translate(-10px, -50px) scale(0.95)' },
          '75%': { transform: 'translate(-30px, -20px) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
