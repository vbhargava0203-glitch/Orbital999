/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#0A0C10',
          100: '#0D1015',
          200: '#12151C',
          300: '#171B23',
        },
        line: 'rgba(255,255,255,0.07)',
        signal: {
          DEFAULT: '#49D3C8',
          dim: '#2A7A73',
        },
        severity: {
          critical: '#E5484D',
          high: '#F5A524',
          medium: '#D9C24E',
          low: '#7C8797',
        },
        ink: {
          DEFAULT: '#E7EAEE',
          dim: '#8B94A3',
          faint: '#5B6472',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: { glass: '0 1px 0 rgba(255,255,255,0.04) inset' },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
