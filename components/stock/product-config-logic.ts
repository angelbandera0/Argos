import { z } from "zod";

const amount = z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number().finite().positive());
const name = z.string().trim().min(1).max(60);

export const presentationSchema = z.object({ name, content: amount });
export const movementUnitSchema = z.object({ name, equivalence: amount });
export const minimumSchema = z.object({
  minimum: z.preprocess((v) => (typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : v === "" ? 0 : v), z.number().finite().min(0)),
});

export const ERROR_MESSAGES: Record<string, string> = {
  NAME_TAKEN: "Ya existe un elemento con ese nombre.",
  INVALID_NAME: "El nombre debe tener entre 1 y 60 caracteres.",
  INVALID_CONTENT: "La cantidad debe ser mayor que cero.",
  INVALID_INPUT: "Revisa los datos e inténtalo de nuevo.",
};

export const configErrorMessage = (code?: string) => (code && ERROR_MESSAGES[code]) || "No se pudo guardar. Inténtalo de nuevo.";

/** clearMinimum stores 0: 0 and null both mean "no minimum". */
export const hasMinimum = (minimum: number | null) => !!minimum && minimum > 0;

export const contentLabel = (content: number, baseUnit: string) => `${new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(content)} ${baseUnit === "l" ? "L" : baseUnit}`;
