/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'red-bean': '#8B2E2E',
        'dark-crimson': '#6B1E1E',
        'coffee-brown': '#6F4E37',
        'light-cream': '#F5E6D3',
        'white-cream': '#FFF8F0',
      },
    },
  },
  plugins: [],
};
