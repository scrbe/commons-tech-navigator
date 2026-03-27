import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  // Disable preflight to avoid conflicts with MUI's CssBaseline CSS reset.
  // MUI manages base styles via CssBaseline — Tailwind's reset would override them.
  corePlugins: {
    preflight: false,
  },
  // Use a prefix so Tailwind utility classes don't collide with MUI class names.
  prefix: 'tw-',
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
