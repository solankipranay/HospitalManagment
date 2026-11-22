/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary:   "#0066CC",
        secondary: "#00A86B",
        danger:    "#DC2626",
        warning:   "#D97706",
        surface:   "#F8FAFC",
        muted:     "#94A3B8",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
