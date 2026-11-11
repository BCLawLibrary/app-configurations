import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import a11y from "eslint-plugin-jsx-a11y";
import sonarjs from "eslint-plugin-sonarjs";
import functional from "eslint-plugin-functional";
import pluginQuery from "@tanstack/eslint-plugin-query";

const USE_FONT_AWESOME =
  "Use Font Awesome's free icons: FontAwesomeIcon from @fortawesome/react-fontawesome with an icon from @fortawesome/free-solid-svg-icons, free-regular-svg-icons or free-brands-svg-icons.";

export default [
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],

  // BC Law guardrails (all files)
  {
    plugins: { sonarjs, functional },
    rules: {
      // accessibility (jsx-a11y strict, as errors)
      ...a11y.flatConfigs.strict.rules,
      // size
      "max-lines-per-function": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
      "react/no-multi-comp": ["error", { ignoreStateless: false }],
      // complexity
      "sonarjs/cognitive-complexity": ["error", 15],
      "max-depth": ["error", 3],
      "max-params": ["error", 3],
      "max-nested-callbacks": ["error", 3],
      // functional style
      "functional/no-let": "error",
      "functional/no-loop-statements": "error",
      "functional/no-classes": "error",
      "functional/no-this-expressions": "error",
      "no-param-reassign": ["error", { props: true }],
    },
  },

  // File size (source files only)
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
    rules: {
      "max-lines": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },

  // Type-aware rules (TypeScript files only)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true, onUnsupportedTypeScriptVersion: "error" }
    },
    rules: {
      "functional/immutable-data": "error",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },

  // Icons: Font Awesome's free icons only
  {
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: [
              "@fortawesome/*",
              "!@fortawesome/react-fontawesome",
              "!@fortawesome/fontawesome-svg-core",
              "!@fortawesome/free-solid-svg-icons",
              "!@fortawesome/free-regular-svg-icons",
              "!@fortawesome/free-brands-svg-icons",
            ],
            message: USE_FONT_AWESOME,
          },
          {
            group: [
              "@awesome.me/*",
              "lucide-react",
              "react-icons",
              "react-icons/*",
              "@heroicons/*",
              "@radix-ui/react-icons",
              "@tabler/icons-react",
              "@phosphor-icons/*",
              "@mui/icons-material",
              "@mui/icons-material/*",
              "@iconify/*",
              "react-bootstrap-icons",
              "bootstrap-icons",
            ],
            message: USE_FONT_AWESOME,
          },
        ],
      }],
      "react/forbid-elements": ["error", { forbid: [{ element: "svg", message: USE_FONT_AWESOME }] }],
    },
  },

  // Tests: keep this block last so it wins
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
      "react/no-multi-comp": "off",
      "max-nested-callbacks": "off",
    },
  },
];
