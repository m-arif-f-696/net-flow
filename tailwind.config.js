/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,php}",
    "./*.{php,html,js}", // Tambahkan baris ini jika file PHP-mu ada di root folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
