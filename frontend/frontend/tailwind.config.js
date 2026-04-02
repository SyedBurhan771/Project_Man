/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",      // Main blue
        sidebar: "#F8FAFC",
        cardbg: "#FFFFFF",
        purpleprog: "#8B5CF6",
        timeprog: "#3B82F6",
        budgetprog: "#10B981",
      },
    },
  },
  plugins: [],
}