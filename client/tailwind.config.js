/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        pbi: {
          blue: '#0078D4',
          blueDark: '#005A9E',
          blueLight: '#C7E0F4',
          green: '#107C10',
          greenLight: '#DFF6DD',
          orange: '#D83B01',
          orangeLight: '#FCE4D6',
          yellow: '#FFB900',
          yellowLight:'#FFF4CE',
          bg: '#F3F2F1',
          canvas: '#FAF9F8',
          card: '#FFFFFF',
          border: '#EDEBE9',
          text: '#201F1E',
          muted: '#605E5C',
          subtle: '#A19F9D',
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        cardHover: '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
        topbar: '0 2px 8px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        DEFAULT: '6px',
        card: '8px',
      }
    },
  },
  plugins: [],
}
