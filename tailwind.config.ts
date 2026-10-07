import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b9d1ff',
          300: '#8fb3ff',
          400: '#5f8dff',
          500: '#3b66f5',
          600: '#2a4bd6',
          700: '#213aad',
          800: '#1c3089',
          900: '#1a2c6e',
        },
      },
      // Softer, layered shadows for cards and dialogs.
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 2px 4px rgba(15, 23, 42, 0.05), 0 8px 20px -6px rgba(15, 23, 42, 0.12)',
        dialog: '0 24px 48px -12px rgba(15, 23, 42, 0.28)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'dialog-in': { from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        'sheet-in': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-up': 'fade-up 0.3s ease-out',
        'dialog-in': 'dialog-in 0.2s ease-out',
        'sheet-in': 'sheet-in 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
