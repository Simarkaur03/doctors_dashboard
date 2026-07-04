/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#7C9A7E',
          dark: '#5C7A5E',
          light: '#EAF0EA',
        },
        accentGray: {
          DEFAULT: '#6B7280',
        },
      },
    },
  },
  plugins: [],
};
