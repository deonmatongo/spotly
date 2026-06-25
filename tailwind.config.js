/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#16A34A',
        accent: '#34D399',
        'app-dark': '#0D1B2A',
        'text-dark': '#0F172A',
        'text-muted': '#64748B',
        'pale-mint': '#E8F5EE',
        'app-bg': '#F1F5F9',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)',
        'card-lg': '0 4px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
