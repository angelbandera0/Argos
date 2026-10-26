import type { PermissionSet } from "@/core/domain/permissions";
import type { NavItem } from "./app-shell";

export const CATEGORIES: NavItem = { id: "categorias", label: "Categorías", href: "/catalogo/categorias", icon: "Tags" };
export const PRODUCTS: NavItem = { id: "productos", label: "Productos", href: "/catalogo/productos", icon: "Box" };

/** Operators never manage categories; "Productos" needs the role's "Ver". */
export const operatorNav = (products: PermissionSet): NavItem[] => (products.view ? [PRODUCTS] : []);

export const HISTORY: NavItem = { id: "historial", label: "Historial", href: "/historial", icon: "History" };
const PRODUCTS_HISTORY: NavItem = { id: "historial", label: "Historial de Productos", href: "/historial/products", icon: "History" };

/** Operators see «Historial de Productos» only with «Ver» on products. */
export const operatorHistoryNav = (products: PermissionSet): NavItem[] => (products.view ? [PRODUCTS_HISTORY] : []);
