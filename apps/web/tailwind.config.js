/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#3B82F6', subtle: '#EFF6FF' },
        surface: { DEFAULT: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', input: '#F1F5F9' },
        text: { primary: '#0F172A', secondary: '#64748B', muted: '#94A3B8', faint: '#CBD5E1' },
        success: { DEFAULT: '#16A34A', light: '#DCFCE7', subtle: '#F0FDF4' },
        warning: { DEFAULT: '#D97706', light: '#FEF3C7', subtle: '#FFFBEB' },
        danger: { DEFAULT: '#DC2626', light: '#FEE2E2', subtle: '#FFF5F5' },
        info: { DEFAULT: '#0891B2', light: '#CFFAFE', subtle: '#ECFEFF' },
        indigo: { DEFAULT: '#4F46E5', dark: '#4338CA', light: '#EEF2FF' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px' },
      spacing: { sidebar: '240px', 'sidebar-sm': '60px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.10)',
        focus: '0 0 0 3px rgba(37,99,235,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        skeleton: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.5' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
