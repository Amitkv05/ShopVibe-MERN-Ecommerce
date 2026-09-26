export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: "readonly", document: "readonly", localStorage: "readonly", sessionStorage: "readonly",
        history: "readonly", navigator: "readonly", fetch: "readonly", Headers: "readonly",
        FormData: "readonly", URLSearchParams: "readonly", crypto: "readonly", setTimeout: "readonly",
        clearTimeout: "readonly", console: "readonly"
      }
    },
    rules: { "no-undef": "error", "no-unreachable": "error" }
  }
];
