module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-900': '#05060a',
        'bg-800': '#0b1221',
        'glass': 'rgba(255,255,255,0.04)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular']
      }
    }
  },
  plugins: []
}
