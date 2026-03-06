/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: "#07080b",
        panel: "#0c0f14",
        neon: "#00F5FF",
        magenta: "#FF3DFF",
        lime: "#7CFF6B",
        amber: "#FFB86B",
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,.55)",
        glow: "0 0 0 1px rgba(0,245,255,.20), 0 10px 40px rgba(0,245,255,.08)",
      },
      borderRadius: {
        "4xl": "2rem"
      }
    },
  },
  plugins: [],
};
