import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#7C3AED',
      },
      borderRadius: {
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}

export default config
