import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases condicionales y resuelve conflictos de Tailwind quedándose con
 * la última. Sin esto, `cn("p-2", "p-4")` dejaría ambas y ganaría la de mayor
 * especificidad en el CSS generado, no la que escribió quien llama.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
