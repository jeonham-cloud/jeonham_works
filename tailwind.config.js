export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', '"Helvetica Neue"', '"Segoe UI"', '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', 'sans-serif'],
        headline: ['"Pretendard Variable"', 'Pretendard', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#f8f9fb',
          container: {
            lowest: '#ffffff',
            low: '#f3f4f6',
            DEFAULT: '#edeef0',
            high: '#e7e8ea',
            highest: '#e1e2e4'
          },
          bright: '#f8f9fb',
          dim: '#d9dadc',
          tint: '#435b9f'
        },
        'on-surface': {
          DEFAULT: '#191c1e',
          variant: '#444650'
        },
        primary: {
          DEFAULT: '#00113a',
          container: '#002366',
          fixed: {
            DEFAULT: '#dbe1ff',
            dim: '#b3c5ff'
          }
        },
        'on-primary': '#ffffff',
        secondary: {
          DEFAULT: '#4f5f7b',
          container: '#cdddff',
          fixed: '#d6e3ff'
        },
        'on-secondary-container': '#51617e',
        tertiary: {
          DEFAULT: '#2d0700',
          container: '#501300',
          fixed: {
            DEFAULT: '#ffdbd0',
            dim: '#ffb59e'
          }
        },
        'on-tertiary-container': '#d37758',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6'
        },
        'on-error-container': '#93000a',
        outline: {
          DEFAULT: '#757682',
          variant: '#c5c6d2'
        }
      }
    }
  },
  plugins: []
}
