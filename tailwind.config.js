/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 工业救援配色
        'dark-bg': '#0a0e27',
        'dark-panel': '#1a1f3a',
        'dark-border': '#2d3748',
        'rescue-orange': '#ff7043',
        'rescue-green': '#4ade80',
        'rescue-red': '#ef4444',
        'rescue-yellow': '#facc15',
        'rescue-blue': '#3b82f6',
      },
      fontFamily: {
        'mono': ['Monaco', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%, 100%': { opacity: '1' },
          '25%, 75%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
