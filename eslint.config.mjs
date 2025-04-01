import reactCompiler from "eslint-plugin-react-compiler";
import react from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";

export default [
  {
    ...react.configs.recommended,
    settings: { react: { version: "detect" } },
  },
  reactCompiler.configs.recommended,
  {
    plugins: {
      prettier: prettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
];
