/**
 * Preset de Tailwind — Dashboard de ventas (Propuesta B · Suave)
 * Uso en tailwind.config.js:
 *   module.exports = { presets: [require('./tailwind.preset.js')], content: [...] }
 * Reglas de uso en DESIGN.md.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        red: {
          DEFAULT: '#FF443B', // marcas gráficas (no texto pequeño)
          strong: '#D92D25',  // botones con texto blanco, texto rojo
          hover: '#B3221B',
          tint: '#FFE6E4',
        },
        yellow: {
          DEFAULT: '#FFC93C', // siempre con texto ink
          tint: '#FFF4CF',
        },
        ink: {
          DEFAULT: '#1C1C1E',
          2: '#45484D',
        },
        muted: '#6B6F76',
        panel: '#F6F8FA',
        surface: '#FFFFFF',
        line: {
          DEFAULT: '#E4E6EA',
          strong: '#C9CDD3',
          soft: '#ECEEF1',
        },
        ring: '#D6D9DE',
        success: { DEFAULT: '#1E7A50', tint: '#E6F4EC', border: '#C4E4D2' },
        warning: { DEFAULT: '#FFC93C', text: '#7A5200', tint: '#FFF4CF', border: '#F6E2A0' },
        danger: { DEFAULT: '#D92D25', text: '#B3221B', tint: '#FFE6E4', border: '#F8C9C5' },
        info: { DEFAULT: '#45484D', tint: '#F6F8FA', border: '#E4E6EA' },
        placeholder: '#8C9097',
        disabled: { bg: '#ECEEF1', text: '#8C9097' },
        'field-error': '#FFF7F6',
        'row-selected': '#FFF4F3',
        hover: '#ECEEF1',
        overlay: 'rgba(28,28,30,0.32)',
      },
      fontFamily: {
        display: ['"Inter Tight"', 'Arial', 'sans-serif'],
        ui: ['Inter', 'Arial', 'sans-serif'],
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      fontSize: {
        display: ['40px', { lineHeight: '1.1', letterSpacing: '-1.2px', fontWeight: '600' }],
        'display-md': ['32px', { lineHeight: '1.15', letterSpacing: '-1px', fontWeight: '600' }],
        'display-sm': ['28px', { lineHeight: '1.15', letterSpacing: '-0.8px', fontWeight: '600' }],
        'kpi-xl': ['52px', { lineHeight: '1', letterSpacing: '-2px', fontWeight: '400' }],
        kpi: ['44px', { lineHeight: '1', letterSpacing: '-1.6px', fontWeight: '400' }],
        'kpi-md': ['34px', { lineHeight: '1', letterSpacing: '-1.2px', fontWeight: '400' }],
        stat: ['34px', { lineHeight: '1.1', letterSpacing: '-1px', fontWeight: '500' }],
        'card-title-lg': ['26px', { lineHeight: '1.15', letterSpacing: '-0.6px', fontWeight: '400' }],
        h2: ['17px', { lineHeight: '1.3', fontWeight: '700' }],
        value: ['20px', { lineHeight: '1.2', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.45' }],
        caption: ['12px', { lineHeight: '1.45' }],
        overline: ['11px', { lineHeight: '1.3', letterSpacing: '0.8px', fontWeight: '600' }],
      },
      spacing: {
        1.5: '6px',
        2.5: '10px',
        3.5: '14px',
        4.5: '18px',
        5.5: '22px',
        sidebar: '236px',
        rail: '84px',
        touch: '44px',
        cta: '52px',
        'bottom-nav': '68px',
      },
      borderRadius: {
        pill: '9999px',
        panel: '28px',
        card: '24px',
        'card-sm': '22px',
        inner: '16px',
        icon: '10px',
        bar: '10px 10px 4px 4px',
        'header-mobile': '0 0 32px 32px',
        dialog: '28px',
        popover: '20px',
        toast: '18px',
        textarea: '16px',
        option: '12px',
        checkbox: '7px',
      },
      boxShadow: {
        active: '0 1px 2px rgba(28,28,30,0.05), 0 6px 16px rgba(28,28,30,0.06)',
        raised: '0 2px 8px rgba(28,28,30,0.08)',
        cta: '0 10px 22px -10px rgba(217,45,37,0.6)',
        floating: '0 12px 30px rgba(28,28,30,0.08)',
        popover: '0 1px 2px rgba(28,28,30,0.05), 0 18px 40px rgba(28,28,30,0.14)',
        toast: '0 1px 2px rgba(28,28,30,0.05), 0 12px 30px rgba(28,28,30,0.10)',
        dialog: '0 24px 60px rgba(28,28,30,0.22)',
        'focus-ring': '0 0 0 2px #FFFFFF, 0 0 0 4px #1C1C1E',
        'focus-field': '0 0 0 4px #FFE6E4',
      },
      screens: {
        tablet: '768px',
        web: '1280px',
      },
    },
  },
};
