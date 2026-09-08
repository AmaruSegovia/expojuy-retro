import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Reglas de frontera arquitectónica.
 *
 * La arquitectura es Vertical Slice sobre tres capas con dependencias
 * unidireccionales: app/ -> features/ -> shared/
 *
 *   app/       capa de composición. Solo rutas; ensambla features. Puede importar todo.
 *   features/  slices verticales autocontenidos. NO se conocen entre sí.
 *   shared/    capa base transversal. No conoce a nadie por encima suyo.
 *
 * Estas reglas convierten esa decisión en un invariante verificable por CI:
 * si alguien rompe la frontera, el lint falla. No es documentación, es un test.
 */
const LAYER_BOUNDARIES = [
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/**"],
              message:
                "shared/ es la capa base y no puede depender de features/. Invertí la dependencia: subí el tipo o el contrato a shared/.",
            },
            {
              group: ["@/app/*", "@/app/**"],
              message: "shared/ no puede depender de app/. app/ es la capa de composición.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/**"],
              message:
                "Un feature no importa a otro feature. Para tu propio slice usá rutas relativas (../components/X); para lo compartido, movelo a shared/.",
            },
            {
              group: ["@/app/*", "@/app/**"],
              message: "features/ no puede depender de app/. app/ compone features, no al revés.",
            },
          ],
        },
      ],
    },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...LAYER_BOUNDARIES,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
