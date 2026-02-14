/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        slate: {
          750: '#293548',
          850: '#172033',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
        modal: '0 25px 50px rgba(0,0,0,0.5)',
        dropdown: '0 10px 25px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.2)',
      },
      borderRadius: {
        card: '12px',
        button: '8px',
      },
      transitionProperty: {
        fast: 'all',
        normal: 'all',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
      },
      transitionTimingFunction: {
        fast: 'ease',
        normal: 'ease',
      },
      keyframes: {
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'progress-countdown': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'tab-underline': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-right': 'slide-out-right 150ms ease-in',
        'scale-in': 'scale-in 200ms ease-out',
        'scale-out': 'scale-out 150ms ease-in',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fade-in 200ms ease-out',
        'progress-countdown': 'progress-countdown linear',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'tab-underline': 'tab-underline 200ms ease-out',
      },
    },
  },
  plugins: [],
};
