/**
 * Tailwind CSS Configuration
 * @type {import('tailwindcss').Config}
 *
 * This configuration adds Roboto as the default font family for the entire application
 * and extends the theme with custom configurations.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      // Setting Roboto as the default font with appropriate fallbacks
      sans: ['Roboto', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
    extend: {
      // Additional theme extensions can be added here
    },
  },
  plugins: [],
}

