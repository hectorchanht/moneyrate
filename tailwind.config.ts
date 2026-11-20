import type { Config } from "tailwindcss";
import { theme } from './src/theme/theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const daisyBuiltInThemes = require('daisyui/src/theming/themes');

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
  daisyui: {
    themes: [
      {
        // Dawn rule (Hector 2026-11-20): light backgrounds are NEVER pure
        // white — built-in daisyUI light has base-100 = oklch(100% 0 0)
        // (#ffffff). Spread the built-in light theme and swap only the base
        // ramp for a warm cream scale (family range: ZhConvert #f7f8f5,
        // RealUFO #efece1); every other token is byte-identical to stock.
        light: {
          ...daisyBuiltInThemes.light,
          "base-100": "#faf6ec",
          "base-200": "#f3ecdc",
          "base-300": "#e8dfc9",
        },
      },
      "dark",
    ],
  },
};

export default config;
