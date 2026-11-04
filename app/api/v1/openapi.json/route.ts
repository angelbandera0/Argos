import { buildOpenApiDocument } from "../_lib/openapi";

export async function GET() {
  return Response.json(buildOpenApiDocument());
}
