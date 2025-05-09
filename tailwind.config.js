/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{html,js}",
    "./public/**/*.{html,js}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Otimizações para produção
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  // Desativa animações em produção para melhor performance
  variants: {
    extend: {
      animation: ['responsive', 'motion-safe', 'motion-reduce'],
    },
  },
} 