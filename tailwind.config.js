/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        lao: ['var(--font-lao)', 'var(--font-inter)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        ember: '#f97316',
        coal:  '#1a1a1a',
        plate: '#242424',
        rim:   '#333333',
        ash:   '#888888',
        gold:  '#f59e0b',
        jade:  '#10b981',
      },
    },
  },
  plugins: [],
}
