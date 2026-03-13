import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#edfaf3',
          100: '#d3f4e3',
          200: '#a9e8ca',
          300: '#72d6aa',
          400: '#3dbd86',
          500: '#25a855',  // TGtG primary
          600: '#1a8a43',
          700: '#177039',
          800: '#165a2f',
          900: '#134a27',
        },
        brand: '#25a855',
        'brand-dark': '#1a8a43',
        charcoal: '#2C2C2C',
        orange: '#FF8C42',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card:     '0 2px 8px rgba(0,0,0,0.08)',
        elevated: '0 4px 20px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
