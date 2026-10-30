/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cluster: {
          bg: '#05070a',
          frame: '#0b0f16',
          card: '#0f1520',
          cardInner: '#131b28',
          border: '#1a2434',
          borderLight: '#253347',
          neon: '#00ff9d',
          mint: '#10b981',
          amber: '#f59e0b',
          orange: '#ff8a00',
          cyan: '#00d4ff',
          danger: '#ef4444',
          muted: '#627288',
          dim: '#334155',
          textBright: '#eaf0f8',
        },
        vahan: {
          dark: '#05070a',
          panel: '#0f1520',
          border: '#1a2434',
          accent: '#00d4ff',
          neon: '#00ff9d',
          amber: '#f59e0b',
          danger: '#ef4444',
          muted: '#627288'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        display: ['Rajdhani', 'JetBrains Mono', 'sans-serif'],
        tech: ['Chakra Petch', 'JetBrains Mono', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'cockpit': '0 0 50px -10px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'neon-mint': '0 0 16px rgba(0, 255, 157, 0.35)',
        'neon-amber': '0 0 16px rgba(245, 158, 11, 0.35)',
        'neon-cyan': '0 0 16px rgba(0, 212, 255, 0.35)',
        'neon-danger': '0 0 20px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}
