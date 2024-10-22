import { type Config } from 'tailwindcss'

export const theme: Config['theme'] = {
  extend: {
    colors: {
      primary: {
        light: '#4da6ff',
        DEFAULT: '#0080ff',
        dark: '#0066cc',
      },
      secondary: {
        light: '#ff9966',
        DEFAULT: '#ff6600',
        dark: '#cc5200',
      },
      background: {
        light: '#f0f0f0',
        DEFAULT: '#e0e0e0',
        dark: '#d0d0d0',
      },
      text: {
        light: '#333333',
        DEFAULT: '#1a1a1a',
        dark: '#000000',
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      DEFAULT: '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'full': '9999px',
    },
  },
}
