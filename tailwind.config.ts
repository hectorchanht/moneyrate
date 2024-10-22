import type { Config } from "tailwindcss";
import { theme } from './src/theme/theme';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: theme,
  plugins: [
    require('@tailwindcss/forms'),
    require('daisyui'),
  ],
};

export default config;
