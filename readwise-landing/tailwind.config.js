/** @type {import('tailwindcss').Config} */
// MyBookSelf theme: forest green, gold, peach.
// The old "blue" and "amber" names are re-pointed to green and gold so every existing page picks up the new look.
const forest = {
  50: '#EEF5F0', 100: '#DCEBE1', 200: '#B9D6C3', 300: '#8DBBA0', 400: '#5E9A78',
  500: '#3C7A59', 600: '#2D6147', 700: '#245039', 800: '#1B4332', 900: '#123524',
};
const gold = {
  50: '#FDF8EC', 100: '#FAEFD0', 200: '#F4DEA0', 300: '#E9C46A', 400: '#DBAC4C',
  500: '#C8963E', 600: '#A87A2B', 700: '#865F20', 800: '#684918', 900: '#4A3410',
};
const peach = {
  50: '#FFF8F1', 100: '#FFF1E6', 200: '#FBD9BE', 300: '#F4BE9A', 400: '#EBA27A',
};
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest, gold, peach,
        blue: forest,
        amber: gold,
        gray: { 50: '#FFF8F1' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
