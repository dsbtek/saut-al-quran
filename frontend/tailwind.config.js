/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          950: '#042f24',
        },
        sand: {
          50: '#faf8f4',
          100: '#f3efe6',
          200: '#e6dfd1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['Amiri', 'Scheherazade New', 'serif'],
      },
    },
  },
  plugins: [],
}
