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
  ["get", "/api/v1/currencies", "List currencies (active, q filters)"],
  ["post", "/api/v1/currencies", "Create a currency", "createCurrency", "201"],
  ["get", "/api/v1/currencies/{id}", "Get a currency with its denominations"],
  ["patch", "/api/v1/currencies/{id}", "Update a currency (default, active)", "updateCurrency", "204"],
  ["delete", "/api/v1/currencies/{id}", "Delete a currency (CURRENCY_IN_USE if used)", undefined, "204"],
  ["get", "/api/v1/currencies/{id}/denominations", "List a currency's denominations by value"],
  ["post", "/api/v1/currencies/{id}/denominations", "Add a denomination", "createDenomination", "201"],
  ["patch", "/api/v1/currencies/{id}/denominations/{denominationId}", "Update a denomination", "updateDenomination", "204"],
  ["delete", "/api/v1/currencies/{id}/denominations/{denominationId}", "Delete a denomination", undefined, "204"],
  ["get", "/api/v1/stock/locations", "List stock locations (warehouse and stores)"],
  ["get", "/api/v1/stock", "List stock by status (locationId, status, q, categoryId, page, pageSize)"],
  ["get", "/api/v1/stock/products/{id}", "Product stock at a location: configuration, lots, status (locationId)"],
  ["get", "/api/v1/stock/movements", "List stock movements (productId, locationId, type, from, to, page, pageSize)"],
  ["get", "/api/v1/stock/products/{id}/config", "Get a product's stock configuration"],
  ["put", "/api/v1/stock/products/{id}/config", "Save storable and base unit", "stockConfig", "204"],
  ["post", "/api/v1/stock/products/{id}/presentations", "Add a presentation", "createPresentation", "201"],
  ["patch", "/api/v1/stock/products/{id}/presentations/{presentationId}", "Update a presentation", "updatePresentation", "204"],
  ["delete", "/api/v1/stock/products/{id}/presentations/{presentationId}", "Delete a presentation", undefined, "204"],
  ["post", "/api/v1/stock/products/{id}/movement-units", "Add a movement unit", "createMovementUnit", "201"],
  ["patch", "/api/v1/stock/products/{id}/movement-units/{unitId}", "Update a movement unit", "updateMovementUnit", "204"],
  ["delete", "/api/v1/stock/products/{id}/movement-units/{unitId}", "Delete a movement unit", undefined, "204"],
  ["put", "/api/v1/stock/minimums", "Set a minimum (null or 0 removes it)", "setMinimum", "204"],
  ["post", "/api/v1/stock/entries/initial", "Register an initial warehouse entry", "stockEntry", "201"],
  ["post", "/api/v1/stock/entries/direct", "Register a direct store entry", "stockEntry", "201"],
  ["post", "/api/v1/stock/preview", "Preview a consumption (writes nothing)", "stockPreview"],
  ["post", "/api/v1/stock/transfers", "Transfer stock from the warehouse to a store", "stockTransfer", "201"],
  ["post", "/api/v1/stock/write-offs", "Write off stock", "stockWriteOff", "201"],
  ["post", "/api/v1/stock/adjustments", "Adjust a lot (restitution or reduction)", "stockAdjustment", "201"],
  ["post", "/api/v1/stock/surplus", "Register surplus stock", "stockSurplus", "201"],
  ["get", "/api/v1/stock/write-off-reasons", "List write-off reasons"],
  ["post", "/api/v1/stock/write-off-reasons", "Create a write-off reason", "createWriteOffReason", "201"],
  ["patch", "/api/v1/stock/write-off-reasons/{id}", "Rename or (de)activate a write-off reason", "updateWriteOffReason", "204"],
  ["delete", "/api/v1/stock/write-off-reasons/{id}", "Delete a write-off reason", undefined, "204"],
  ["get", "/api/v1/solicitudes", "List replenishment requests (storeId, status, page, pageSize)"],
  ["post", "/api/v1/solicitudes", "Create a replenishment request", "createRequest", "201"],
  ["get", "/api/v1/solicitudes/bag", "List the purchase bag (lines marked to buy)"],
  ["get", "/api/v1/solicitudes/{id}", "Get a request with lines and assignments"],
  ["post", "/api/v1/solicitudes/{id}/lines/{lineId}", "Attend a request line (fulfilled, to_buy, pending, rejected)", "attendRequestLine", "201"],
  ["get", "/api/v1/pedidos", "List purchase orders (status, buyerId, page, pageSize)"],
  ["post", "/api/v1/pedidos", "Create (build) a purchase order", "createOrder", "201"],
  ["get", "/api/v1/pedidos/{id}", "Get an order (costs only with permission)"],
  ["put", "/api/v1/pedidos/{id}/buyer", "Assign the buyer", "assignBuyer", "204"],
  ["post", "/api/v1/pedidos/{id}/purchase", "Register the purchase (quantities and costs)", "registerPurchase", "204"],
  ["post", "/api/v1/pedidos/{id}/submit", "Send the purchase to review (returns given, spent, leftover)"],
  ["put", "/api/v1/pedidos/{id}/review", "Save the review without confirming", "saveOrderReview", "204"],
  ["post", "/api/v1/pedidos/{id}/confirm", "Confirm the order; received stock enters", "confirmOrder", "204"],
  ["post", "/api/v1/pedidos/{id}/return", "Return the order to the buyer with a note", "returnOrder", "204"],
  ["post", "/api/v1/pedidos/{id}/adjustments", "Adjust a fulfilled order's lots with a reason", "adjustOrder", "201"],
  ["get", "/api/v1/notifications", "List own notifications (module, operation, priority, read, storeId, from, to, page, pageSize)"],
  ["get", "/api/v1/notifications/unread-count", "Count own unread notifications"],
  ["post", "/api/v1/notifications/read", "Mark own notifications read (ids omitted = all)", "markNotificationsRead"],
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
        "409": problemResponse("Conflict (duplicate name or code, unit in use)"),
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
