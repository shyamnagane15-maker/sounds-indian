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
        ink: '#1F2A3D',
        ivory: '#F4EFE4',
        gold: '#D9A22B',
        madder: '#A8402F',
        leaf: '#55694A',
      },
    },
  },
  plugins: [],
};
export default config;