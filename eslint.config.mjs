import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      "react/jsx-no-undef": "warn",
      "jsx-a11y/alt-text": [
        "warn",
        {
          elements: ["img", "object", "area", "input[type=\"image\"]"],
          img: [],
          object: [],
          area: [],
          "input[type=\"image\"]": []
        }
      ],
      "@next/next/no-page-custom-font": "warn",
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
