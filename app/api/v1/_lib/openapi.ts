import { z } from "zod";
import { schemas } from "./schemas";

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

type Op = [method: string, path: string, summary: string, body?: keyof typeof schemas, ok?: string];

const OPERATIONS: Op[] = [
  ["get", "/api/v1/admins", "List administrators (superadmin)"],
  ["post", "/api/v1/admins", "Create an administrator (temporary password shown once)", "createAdmin", "201"],
  ["get", "/api/v1/companies", "List companies visible to the caller"],
  ["post", "/api/v1/companies", "Create a company", "name", "201"],
  ["patch", "/api/v1/companies/{id}", "Rename a company", "name", "204"],
  ["post", "/api/v1/companies/{id}:deactivate", "Deactivate a company", "deactivate", "204"],
  ["post", "/api/v1/companies/{id}:reactivate", "Reactivate a company", "reactivate", "204"],
  ["post", "/api/v1/companies/{id}/admins", "Grant an administrator access", "grantAccess", "204"],
  ["delete", "/api/v1/companies/{id}/admins/{adminId}", "Revoke an administrator's access", undefined, "204"],
  ["patch", "/api/v1/companies/{id}/settings", "Update company settings", "settings", "204"],
  ["post", "/api/v1/sites", "Create a site", "createSite", "201"],
  ["patch", "/api/v1/sites/{id}", "Rename a site", "name", "204"],
  ["post", "/api/v1/sites/{id}:deactivate", "Deactivate a site", "deactivate", "204"],
  ["post", "/api/v1/sites/{id}:reactivate", "Reactivate a site", "reactivate", "204"],
  ["post", "/api/v1/stores", "Create a store", "createStore", "201"],
  ["patch", "/api/v1/stores/{id}", "Rename a store", "name", "204"],
  ["post", "/api/v1/stores/{id}:deactivate", "Deactivate a store", "deactivate", "204"],
  ["post", "/api/v1/stores/{id}:reactivate", "Reactivate a store", "reactivate", "204"],
  ["post", "/api/v1/users", "Create an operator (PIN shown once)", "createOperator", "201"],
  ["post", "/api/v1/users/{id}:reset-pin", "Reset an operator's PIN (shown once)"],
  ["post", "/api/v1/users/{id}:unlock", "Unlock an operator (new PIN shown once)"],
  ["post", "/api/v1/users/{id}:deactivate", "Deactivate an operator", undefined, "204"],
  ["put", "/api/v1/users/{id}/stores", "Replace an operator's store assignments", "assignStores", "204"],
  ["patch", "/api/v1/users/{id}/role", "Change an operator's role", "changeRole", "204"],
  ["get", "/api/v1/roles", "List roles"],
  ["post", "/api/v1/roles", "Create a role", "createRole", "201"],
  ["patch", "/api/v1/roles/{id}", "Update a role", "updateRole"],
  ["delete", "/api/v1/roles/{id}", "Delete a role", undefined, "204"],
  ["put", "/api/v1/roles/{id}/exclusions", "Set the companies a role excludes", "exclusions"],
  ["get", "/api/v1/categories", "List categories"],
  ["post", "/api/v1/categories", "Create a category", "createCategory", "201"],
  ["patch", "/api/v1/categories/{id}", "Rename a category", "name", "204"],
  ["delete", "/api/v1/categories/{id}", "Delete a category", undefined, "204"],
  ["get", "/api/v1/products", "List products"],
  ["post", "/api/v1/products", "Create a product", "createProduct", "201"],
  ["patch", "/api/v1/products/{id}", "Update a product", "updateProduct", "204"],
  ["post", "/api/v1/products/{id}:activate", "Activate a product", undefined, "204"],
  ["post", "/api/v1/products/{id}:deactivate", "Deactivate a product", undefined, "204"],
  ["delete", "/api/v1/products/{id}", "Delete a product", undefined, "204"],
  ["get", "/api/v1/history/{module}", "List a module's history (cursor)"],
  ["get", "/api/v1/auth-events", "List authentication events (cursor)"],
];

export function buildOpenApiDocument(): object {
  const problemResponse = (description: string) => ({
    description,
    content: { "application/problem+json": { schema: { $ref: "#/components/schemas/Problem" } } },
  });
  const paths: Record<string, Record<string, unknown>> = {};
  for (const [method, path, summary, body, ok = "200"] of OPERATIONS) {
    (paths[path] ??= {})[method] = {
      summary,
      ...(body && {
        requestBody: {
          required: true,
          content: { "application/json": { schema: schema(schemas[body]) } },
        },
      }),
      responses: {
        [ok]: { description: "OK" },
        "401": problemResponse("Missing or invalid token"),
        "403": problemResponse("Forbidden"),
        "404": problemResponse("Not found"),
        "422": problemResponse("Rule violation or invalid input"),
      },
    };
  }
  return {
    openapi: "3.1.0",
    info: { title: "Argos API", version: "1.0.0" },
    servers: [{ url: "/" }],
    security: [{ bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
      schemas: { Company: schema(Company), Problem: schema(Problem) },
    },
  };
}
