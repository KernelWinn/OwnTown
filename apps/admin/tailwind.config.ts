import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sq: {
          green: '#00B43C',
          'green-light': '#E6F9ED',
          dark: '#1A1A1A',
          'dark-hover': '#2A2A2A',
          'dark-active': '#333333',
          ink: '#1A1A1A',
          'ink-secondary': '#4B5563',
          'ink-muted': '#9CA3AF',
          surface: '#FFFFFF',
          bg: '#F7F7F7',
          border: '#E5E7EB',
          'border-dark': '#D1D5DB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
