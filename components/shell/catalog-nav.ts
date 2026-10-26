import type { PermissionSet } from "@/core/domain/permissions";
import type { NavItem } from "./app-shell";

export const CATEGORIES: NavItem = { id: "categorias", label: "Categorías", href: "/catalogo/categorias", icon: "Tags" };
export const PRODUCTS: NavItem = { id: "productos", label: "Productos", href: "/catalogo/productos", icon: "Box" };

/** Operators never manage categories; "Productos" needs the role's "Ver". */
export const operatorNav = (products: PermissionSet): NavItem[] => (products.view ? [PRODUCTS] : []);
