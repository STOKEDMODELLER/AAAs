/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include all React component files
    "./public/index.html",       // Include index.html for Tailwind styles
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
