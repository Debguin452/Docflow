import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        'tool':     '0 0 0 1px rgba(37,99,235,0.10), 0 4px 16px 0 rgba(37,99,235,0.06)',
        'inner-sm': 'inset 0 1px 2px 0 rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'slide-up':    'slideUp 0.25s ease-out',
        'fade-up':     'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':    'scaleIn 0.22s cubic-bezier(0.16,1,0.3,1) both',
        'dropdown':    'dropdown 0.16s cubic-bezier(0.16,1,0.3,1) both',
        'page-in':     'pageIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'pop':         'pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        'blob':        'blob 20s ease-in-out infinite',
        'blob-slow':   'blob 28s ease-in-out infinite reverse',
        'float':       'float 6s ease-in-out infinite',
        'float-delay': 'float 7s ease-in-out 1.5s infinite',
        'shimmer':     'shimmer 2.2s linear infinite',
        'stripes':     'stripes 1s linear infinite',
        'marquee':     'marquee 45s linear infinite',
        'gradient-x':  'gradientX 6s ease infinite',
        'check-draw':  'checkDraw 0.5s 0.15s ease-out both',
        'ring-out':    'ringOut 0.9s ease-out both',
        'toast-in':    'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'word-in':     'wordIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'spin-slow':   'spin 2s linear infinite',
        'pulse-slow':  'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        dropdown: {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pageIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%':   { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%':      { transform: 'translate3d(40px,-30px,0) scale(1.1)' },
          '66%':      { transform: 'translate3d(-30px,30px,0) scale(0.95)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--r, 0deg))' },
          '50%':      { transform: 'translateY(-14px) rotate(var(--r, 0deg))' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        stripes: {
          from: { backgroundPosition: '0 0' },
          to:   { backgroundPosition: '28px 0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        checkDraw: {
          from: { strokeDashoffset: '30' },
          to:   { strokeDashoffset: '0' },
        },
        ringOut: {
          from: { opacity: '0.5', transform: 'scale(0.6)' },
          to:   { opacity: '0', transform: 'scale(1.7)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.9)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        wordIn: {
          from: { opacity: '0', transform: 'translateY(60%) rotateX(-40deg)' },
          to:   { opacity: '1', transform: 'translateY(0) rotateX(0)' },
        },
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}

export default config
