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
          primary: '#2563eb',
          secondary: '#1e40af',
          accent: '#0ea5e9',
          dark: '#1f2937',
          light: '#f3f4f6',
        }
      }
    },
  },
  plugins: [],
}
