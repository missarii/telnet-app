/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        border: '#1f1f1f',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        muted: '#6b7280',
        foreground: '#f9fafb',
      },
    },
  },
  plugins: [],
};
