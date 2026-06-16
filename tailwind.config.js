/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        distrac: {
          primary:   '#ff6b00',
          hover:     '#e55f00',
          active:    '#cc5400',
          light:     '#fff3eb',
          muted:     'rgba(255,107,0,0.12)',
          ring:      'rgba(255,107,0,0.35)',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
