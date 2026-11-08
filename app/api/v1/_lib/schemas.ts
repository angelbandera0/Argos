import { z } from "zod";
import { REASON_CODES } from "@/core/domain/deactivation";
import { SPECIAL_PERMISSIONS } from "@/core/domain/permissions";

const id = z.string().min(1);
const modules = ["products", "currencies", "stock", "requests", "orders", "notifications"] as const;
const permissionMap = z.partialRecord(z.enum(modules), z.object({ view: z.boolean(), create: z.boolean(), edit: z.boolean(), delete: z.boolean() }));
const special = z.array(
  z.object({ permission: z.enum(SPECIAL_PERMISSIONS), warehouse: z.boolean() }),
);

const storeParts = z.array(z.object({ storeId: id, qty: z.number() }));
const picks = z.array(z.object({ lotId: id, qty: z.number() })).optional();
const movement = { productId: id, qty: z.number(), unit: z.string(), picks, deviationReason: z.string().optional() };
const entry = {
  productId: id,
  locationId: id,
  qty: z.number(),
  unit: z.string(),
  content: z.number().optional(),
  unitCost: z.number().optional(),
  pricePerPresentation: z.number().optional(),
  currencyId: id.optional(),
  receivedAt: z.string().optional(),
};

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
    permissions: permissionMap,
    specialPermissions: special.optional(),
  }),
  updateRole: z.object({
    name: z.string().optional(),
    sessionSeconds: z.number().nullable().optional(),
    permissions: permissionMap.optional(),
    specialPermissions: special.optional(),
  }),
  exclusions: z.object({ companyIds: z.array(id) }),
  createCategory: z.object({ companyId: id.optional(), name: z.string() }),
  markNotificationsRead: z.object({ ids: z.array(z.uuid()).optional() }),
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
  stockConfig: z.object({ storable: z.boolean(), baseUnit: z.string() }),
  createPresentation: z.object({ name: z.string(), content: z.number() }),
  updatePresentation: z.object({ name: z.string().optional(), content: z.number().optional(), active: z.boolean().optional() }),
  createMovementUnit: z.object({ name: z.string(), equivalence: z.number() }),
  updateMovementUnit: z.object({ name: z.string().optional(), equivalence: z.number().optional(), active: z.boolean().optional() }),
  setMinimum: z.object({ productId: id, locationId: id, minimum: z.number().nullable() }),
  stockEntry: z.object(entry),
  stockPreview: z.object({ ...movement, locationId: id }),
  stockTransfer: z.object({ ...movement, fromLocationId: id, toLocationId: id }),
  stockWriteOff: z.object({ ...movement, locationId: id, reasonId: id, reasonText: z.string().optional() }),
  stockAdjustment: z.object({ lotId: id, delta: z.number(), reasonText: z.string() }),
  stockCostAdjustment: z.object({ newUnitCost: z.number(), reason: z.string() }),
  stockSurplus: z.object({
    productId: id,
    locationId: id,
    qty: z.number(),
    unit: z.string().optional(),
    content: z.number().optional(),
    reasonText: z.string(),
    unitCost: z.number().optional(),
    currencyId: id.optional(),
  }),
  createRequest: z.object({ companyId: id.optional(), storeId: id, note: z.string().optional(), lines: z.array(z.object({ productId: id, qty: z.number(), unit: z.string() })) }),
  attendRequestLine: z.object({
    companyId: id.optional(),
    kind: z.enum(["fulfilled", "to_buy", "pending", "rejected"]),
    qtyBase: z.number(),
    reason: z.string().optional(),
    picks,
    deviationReason: z.string().optional(),
  }),
  createOrder: z.object({
    companyId: id.optional(),
    currencyId: id.optional(),
    note: z.string().optional(),
    lines: z.array(
      z.object({
        productId: id,
        dest: z.enum(["warehouse", "store", "direct"]),
        storeId: id.optional(),
        qty: z.number(),
        unit: z.string(),
        content: z.number(),
        assignmentId: id.optional(),
        plan: storeParts.optional(),
      }),
    ),
  }),
  assignBuyer: z.object({ companyId: id.optional(), buyerId: id }),
  registerPurchase: z.object({
    companyId: id.optional(),
    lines: z.array(z.object({ lineId: id, qtyBought: z.number(), unitCost: z.number() })),
    amountGiven: z.number().optional(),
  }),
  saveOrderReview: z.object({ companyId: id.optional(), lines: z.array(z.object({ lineId: id, qtyReceived: z.number() })) }),
  confirmOrder: z.object({
    companyId: id.optional(),
    lines: z.array(z.object({ lineId: id, qtyReceived: z.number().optional(), reparto: storeParts.optional() })).optional(),
  }),
  returnOrder: z.object({ companyId: id.optional(), note: z.string() }),
  adjustOrder: z.object({ companyId: id.optional(), reason: z.string(), lines: z.array(z.object({ lotId: id, delta: z.number() })) }),
  createWriteOffReason: z.object({ companyId: id, code: z.string(), name: z.string() }),
  updateWriteOffReason: z.object({ name: z.string().optional(), active: z.boolean().optional() }),
};
