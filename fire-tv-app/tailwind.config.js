/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amazon: {
          orange: '#FF9900',
          hover: '#FFAC33',
          glow: 'rgba(255, 153, 0, 0.45)',
          prime: '#00A8E1',
          primeGlow: 'rgba(0, 168, 225, 0.45)',
          dark: '#0F172A',
          charcoal: '#131921',
        },
        alexa: {
          cyan: '#00CAFF',
          blue: '#1E88E5',
          glow: 'rgba(0, 202, 255, 0.5)',
        },
        vega: {
          bg: '#080B10',
          surface: '#101622',
          surfaceHover: '#182235',
          border: 'rgba(255, 255, 255, 0.08)',
          borderBright: 'rgba(255, 153, 0, 0.35)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-orange': '0 0 25px rgba(255, 153, 0, 0.35), 0 0 10px rgba(255, 153, 0, 0.2)',
        'neon-cyan': '0 0 25px rgba(0, 202, 255, 0.4), 0 0 10px rgba(0, 202, 255, 0.25)',
        'neon-prime': '0 0 25px rgba(0, 168, 225, 0.4), 0 0 10px rgba(0, 168, 225, 0.2)',
        'tv-card': '0 10px 30px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 15px rgba(255, 153, 0, 0.2)' },
          '100%': { boxShadow: '0 0 35px rgba(255, 153, 0, 0.6), 0 0 15px rgba(0, 202, 255, 0.4)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
