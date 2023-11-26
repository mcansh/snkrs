import { quote as escape } from "shell-quote";

let isWin = process.platform === "win32";

export default {
  "**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}": (filenames) => {
    let escapedFileNames = filenames
      .map((filename) => `"${isWin ? filename : escape([filename])}"`)
      .join(" ");
    let filenamesForESLint = filenames.map((f) => `"${f}"`).join(" ");

    return [
      `eslint --cache --fix ${filenamesForESLint}`,
      `jest --bail --findRelatedTests ${escapedFileNames}`,
    ];
  },
  "**/*.{json,yml,yaml,css,less,scss,md,graphql,mdx}": (filenames) => {
    let escapedFileNames = filenames
      .map((filename) => `"${isWin ? filename : escape([filename])}"`)
      .join(" ");
    return [`prettier --write ${escapedFileNames}`];
  },
};
