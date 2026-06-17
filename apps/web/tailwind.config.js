/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // NexStay Brand Colors
        brand: {
          primary: '#6C63FF',
          'primary-hover': '#5b52e8',
          secondary: '#22D3EE',
          accent: '#F97316',
        },
        surface: {
          dark: '#0F0F1A',
          card: '#1A1A2E',
          'card-hover': '#1f1f38',
          border: '#2D2D4A',
          input: '#16213E',
        },
        text: {
          primary: '#F8FAFC',
          muted: '#94A3B8',
          faint: '#475569',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      spacing: {
        sidebar: '260px',
        'sidebar-collapsed': '72px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6C63FF 0%, #22D3EE 100%)',
        'card-gradient': 'linear-gradient(145deg, #1A1A2E 0%, #16213E 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0F0F1A 0%, #0a0a14 100%)',
      },
      boxShadow: {
        'brand': '0 0 40px rgba(108, 99, 255, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(108, 99, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
