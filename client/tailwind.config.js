// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'wr-primary': 'var(--color-primary)',
        'wr-primary-dark': 'var(--color-primary-dark)',
        'wr-sidebar': 'var(--color-sidebar)',
        'wr-bg-canvas': 'var(--color-bg-canvas)',
        'wr-bg-card': 'var(--color-surface)',
        'wr-text-primary': 'var(--color-text-primary)',
        'wr-text-secondary': 'var(--color-text-secondary)',
        'wr-border': 'var(--color-border)',
      },
      boxShadow: {
        premium: '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        'wr-card': '20px',
        'wr-premium': '24px',
      },
    },
  },
  plugins: [],
}