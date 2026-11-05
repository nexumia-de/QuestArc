/**
 * Theme variables as Super Productivity sets them in plugin views, for the
 * preview only. Values transcribed from Super Productivity's
 * src/styles/_css-variables.scss at c5eb3f6 (MIT, © Johannes Millan); the
 * primary colour is the default of the Today context (#6495ED).
 */
export const THEME = {
  light: {
    '--bg': '#f8f8f7',
    '--bg-darker': 'rgb(235, 235, 235)',
    '--bg-lighter': '#fff',
    '--text-color': 'rgb(44, 44, 44)',
    '--text-color-muted': 'rgba(44, 44, 44, 0.66)',
    '--text-color-most-intense': 'rgb(0, 0, 0)',
    '--divider-color': 'rgba(0, 0, 0, 0.12)',
    '--state-hover': 'rgba(0, 0, 0, 0.06)',
    '--card-shadow': '0 1px 3px rgba(0, 0, 0, 0.2)',
    '--is-dark-theme': '0',
  },
  dark: {
    '--bg': '#131314',
    '--bg-darker': 'rgb(0, 0, 0)',
    '--bg-lighter': 'rgb(51, 51, 51)',
    '--text-color': 'rgb(230, 230, 230)',
    '--text-color-muted': 'rgba(235, 235, 235, 0.65)',
    '--text-color-most-intense': 'rgb(255, 255, 255)',
    '--divider-color': 'rgba(255, 255, 255, 0.12)',
    '--state-hover': 'rgba(255, 255, 255, 0.06)',
    '--card-shadow': '0 1px 3px rgba(0, 0, 0, 0.6)',
    '--is-dark-theme': '1',
  },
  shared: {
    '--c-primary': '#6495ed',
    '--button-primary-label': '#fff',
    '--font-primary-stack': 'Roboto, "Helvetica Neue", Arial, sans-serif',
  },
} as const;

export const themeCss = (mode: 'light' | 'dark'): string =>
  `:root{${Object.entries({ ...THEME.shared, ...THEME[mode] })
    .map(([name, value]) => `${name}:${value}`)
    .join(';')}}`;
