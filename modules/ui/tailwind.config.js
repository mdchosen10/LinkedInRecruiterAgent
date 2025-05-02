/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  safelist: [
    // Add classes that might be used dynamically
    'flex', 'h-screen', 'w-screen', 'items-center', 'justify-center',
    'animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-t-2', 'border-b-2',
    'border-linkedin-blue'
  ],
  theme: {
    extend: {
      colors: {
        'linkedin-blue': '#0077B5',
        'linkedin-dark-blue': '#006097',
        'linkedin-lightest-blue': '#E8F4FA'
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [],
}