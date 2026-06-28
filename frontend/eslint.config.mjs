import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "@next/next/no-page-custom-font": "off",
      // React 19 / eslint-plugin-react-hooks@7 — too strict for localStorage boot,
      // cmd-k reset, and animation init patterns already in the codebase.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
