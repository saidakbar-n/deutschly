/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        deutsch: {
          blue: '#2563eb',
          purple: '#7c3aed',
          dark: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
