/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1e3a8a', // a deep blue
        'brand-secondary': '#1d4ed8', // a slightly lighter blue
        'brand-accent': '#f97316', // an orange accent
        'brand-light': '#f0f9ff', // very light blue
      }
    },
  },
  plugins: [],
}
