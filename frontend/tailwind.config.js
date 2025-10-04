/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#765391',
        light: '#E9E9E9',
        lighter: '#F5F5F5',
        dark: '#333333',
        gray: '#666666',
        lightgray: '#E1E1E1'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.05)',
        'button': '0 2px 4px rgba(0,0,0,0.1)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
