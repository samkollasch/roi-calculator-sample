import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#00B140",
          tertiary: "#E7E7E7",
          lightgrey: "#F3F3F3",
          border: "#D4D4D4",
        },
        tint: {
          green: "#CDEFCD",
          "green-muted": "#E5F5E0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
