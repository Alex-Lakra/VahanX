/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vahan: {
          dark: '#0a0d14',
          panel: '#111726',
          border: '#1e293b',
          accent: '#00e5ff',
          neon: '#00ff66',
          amber: '#ffaa00',
          danger: '#ff2222',
          muted: '#64748b'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}

