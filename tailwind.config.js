/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4f46e5",
          light: "#6366f1",
          dark: "#3730a3",
        },
      },
    },
  },
  safelist: [
    "bg-indigo-600",
    "bg-violet-600",
    "bg-sky-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-slate-600",
    "bg-fuchsia-600",
    "border-indigo-600",
    "border-violet-600",
    "border-sky-600",
    "border-emerald-600",
    "border-rose-600",
    "border-amber-600",
    "border-slate-600",
    "border-fuchsia-600",
  ],
  plugins: [],
};
