import { z } from "zod";

const Company = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
  sessionCapSeconds: z.number().int(),
});

const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.string().optional(),
});

const schema = (s: z.ZodType) => z.toJSONSchema(s, { target: "openapi-3.0" });

export function buildOpenApiDocument(): object {
  const problemResponse = (description: string) => ({
    description,
    content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } },
  });
  return {
    openapi: "3.1.0",
    info: { title: "Argos API", version: "1.0.0" },
    servers: [{ url: "/api/v1" }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/v1/companies": {
        get: {
          summary: "List companies visible to the caller",
          responses: {
            "200": {
              description: "Companies",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Company" } },
                },
              },
            },
            "401": problemResponse("Missing or invalid token"),
            "403": problemResponse("Forbidden"),
          },
        },
      },
    },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
      schemas: { Company: schema(Company), Problem: schema(Problem) },
    },
  };
}
