/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  safelist: [
    // Add all the Tailwind classes your app actually uses
    'flex', 'h-screen', 'w-screen', 'items-center', 'justify-center',
    'animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-t-2', 'border-b-2',
    'border-linkedin-blue'
    // ...etc (add more as needed)
  ],
  theme: {
    extend: {
      colors: {
        'linkedin-blue': '#0077B5',
      },
    },
  },
  plugins: [],
}