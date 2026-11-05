import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTs,

  // BC Law guardrails
  {
    rules: {
      "max-lines-per-function": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
      "react/no-multi-comp": ["error", { ignoreStateless: false }],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
    rules: {
      "max-lines": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
      "react/no-multi-comp": "off",
    },
  },
];
