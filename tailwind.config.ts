import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        meq: {
          sky: "#4A90D9",
          "sky-light": "#E8F1FB",
          leaf: "#4CAF7D",
          "leaf-light": "#E8F5EE",
          sun: "#F5A623",
          "sun-light": "#FEF3E2",
          coral: "#E87461",
          "coral-light": "#FDEAE7",
          cloud: "#F7F8FA",
          slate: "#3D4F5F",
          mist: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
export default config;
