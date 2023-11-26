import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./app/**/*.{js,ts,tsx,md,mdx}", "./remix.config.js"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      inset: {
        "1/2": "50%",
      },
      screens: {
        xs: "475px",
      },
      colors: {
        blue: {
          bsod: "#0827F5",
        },
      },
      backgroundImage({ theme }) {
        let color = theme("colors.indigo.500");
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4.95 10"><rect fill="white" width="4.95" height="10" /><polygon fill="${color}" points="1.41 4.67 2.48 3.18 3.54 4.67 1.41 4.67" /><polygon fill="${color}" points="3.54 5.33 2.48 6.82 1.41 5.33 3.54 5.33" /></svg>`;
        let base64 = Buffer.from(svg).toString("base64");
        return {
          select: "url(data:image/svg+xml;base64," + base64 + ")",
        };
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ["disabled"],
      borderColor: ["focus-within"],
      opacity: ["disabled"],
      cursor: ["disabled"],
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
