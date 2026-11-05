import { fileURLToPath } from "node:url";

export default {
  plugins: [fileURLToPath(import.meta.resolve("prettier-plugin-tailwindcss"))],
  tailwindStylesheet: "./src/app/globals.css",
};
