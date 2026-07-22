import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#003057",
        teal: "#30CDD7",
        "light-teal": "#B4EBF5",
        "dark-teal": "#1E96A5",
        "bright-red": "#FF3750",
        "warm-white": "#FAF5ED",
        "warm-gold": "#BC9A6E",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
