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
    },
  },
  plugins: [],
};

export default config;
