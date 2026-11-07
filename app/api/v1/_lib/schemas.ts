import { z } from "zod";
import { REASON_CODES } from "@/core/domain/deactivation";

const id = z.string().min(1);
const op = z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), delete: z.boolean() });

export const schemas = {
  createAdmin: z.object({ email: z.email(), displayName: z.string() }),
  name: z.object({ name: z.string() }),
  grantAccess: z.object({ adminId: id }),
  settings: z.object({ sessionCapSeconds: z.number() }),
  createSite: z.object({ companyId: id, name: z.string() }),
  createStore: z.object({ companyId: id, siteId: id, name: z.string() }),
  deactivate: z.object({ reason: z.object({ code: z.enum(REASON_CODES), text: z.string().optional() }) }),
  reactivate: z.object({ text: z.string() }),
  createOperator: z.object({
    companyId: id,
    name: z.string(),
    displayName: z.string(),
    roleId: id,
    storeIds: z.array(id),
  }),
  assignStores: z.object({ assignments: z.array(z.object({ storeId: id, roleId: id })) }),
  changeRole: z.object({ storeId: id.nullable(), roleId: id }),
  createRole: z.object({
    name: z.string(),
    sessionSeconds: z.number().nullable().optional(),
    excludedCompanyIds: z.array(id).optional(),
    permissions: z.object({ products: op }),
  }),
  updateRole: z.object({
    name: z.string().optional(),
    sessionSeconds: z.number().nullable().optional(),
    permissions: z.object({ products: op }).optional(),
  }),
  exclusions: z.object({ companyIds: z.array(id) }),
  createCategory: z.object({ companyId: id.optional(), name: z.string() }),
  createCurrency: z.object({
    companyId: id.optional(),
    code: z.string(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    isDefault: z.boolean().optional(),
    active: z.boolean().optional(),
  }),
  updateCurrency: z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    symbol: z.string().optional(),
    decimals: z.number().optional(),
    isDefault: z.boolean().optional(),
    active: z.boolean().optional(),
  }),
  createDenomination: z.object({ value: z.number(), kind: z.enum(["bill", "coin"]), active: z.boolean().optional() }),
  updateDenomination: z.object({
    value: z.number().optional(),
    kind: z.enum(["bill", "coin"]).optional(),
    active: z.boolean().optional(),
  }),
  createProduct: z.object({
    companyId: id.optional(),
    name: z.string(),
    categoryId: id,
    description: z.string().nullable().optional(),
    active: z.boolean().optional(),
  }),
  updateProduct: z.object({
    name: z.string().optional(),
    categoryId: id.optional(),
    description: z.string().nullable().optional(),
  }),
};
