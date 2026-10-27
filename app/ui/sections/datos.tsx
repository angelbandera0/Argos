"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { Sort } from "@/components/ui/data-table-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Specimen } from "../gallery";
import { categorias } from "./categorias";

type Order = { id: string; client: string; status: "Pagado" | "Pendiente" | "Anulado"; total: number; items: number };

const clients = ["Ana Pérez", "Luis Gómez", "Marta Ruiz", "Pedro Soto", "Elena Díaz", "Raúl Vega", "Sofía León"];
const statuses = ["Pagado", "Pendiente", "Anulado"] as const;
const ORDERS: Order[] = Array.from({ length: 14 }, (_, i) => ({
  id: `#${1042 + i}`,
  client: clients[i % clients.length],
  status: statuses[i % 3],
  total: 1240 + ((i * 3797) % 9000) / 10,
  items: 1 + ((i * 5) % 9),
}));

const money = new Intl.NumberFormat("es", { style: "currency", currency: "USD" });
const variant = { Pagado: "success", Pendiente: "warning", Anulado: "danger" } as const;

const columns: Column<Order>[] = [
  { id: "id", header: "Pedido", cell: (o) => <strong>{o.id}</strong>, sortValue: (o) => o.id },
  { id: "client", header: "Cliente", cell: (o) => o.client, sortValue: (o) => o.client },
  { id: "status", header: "Estado", cell: (o) => <Badge variant={variant[o.status]}>{o.status}</Badge>, sortValue: (o) => o.status },
  { id: "items", header: "Artículos", align: "end", cell: (o) => o.items, sortValue: (o) => o.items },
  { id: "total", header: "Total", align: "end", cell: (o) => <strong>{money.format(o.total)}</strong>, sortValue: (o) => o.total },
];

const actions = (o: Order) => [
  { label: "Ver detalle", onSelect: () => {} },
  { label: "Imprimir", onSelect: () => {} },
  { label: `Anular ${o.id}`, onSelect: () => {}, destructive: true },
];

export function DatatableSection() {
  const [serverSort, setServerSort] = useState<Sort | null>({ id: "total", dir: "desc" });
  const [serverPage, setServerPage] = useState(1);
  const sorted = [...ORDERS].sort((a, b) => (serverSort?.dir === "asc" ? 1 : -1) * (a.total - b.total));
  const serverRows = sorted.slice((serverPage - 1) * 5, serverPage * 5);
  return (
    <>
      <Specimen title="Orden, selección, paginación y acciones" note="Clic en el encabezado para ordenar; casillas con selección mixta que se conserva entre páginas; menú «⋯» por fila.">
        <DataTable
          label="Pedidos"
          columns={columns}
          rows={ORDERS}
          getRowId={(o) => o.id}
          selectable
          pageSize={8}
          rowActions={actions}
          bulkActions={<><Button size="sm" variant="secondary">Exportar</Button><Button size="sm" variant="danger">Anular</Button></>}
        />
      </Specimen>
      <Specimen title="Controlada desde fuera (server actions / searchParams)" note="Orden y página las gobierna el padre; la tabla solo muestra las filas recibidas (aquí 5 por página, total 14).">
        <DataTable
          label="Pedidos (servidor)"
          columns={columns}
          rows={serverRows}
          getRowId={(o) => o.id}
          sort={serverSort}
          onSortChange={setServerSort}
          page={serverPage}
          onPageChange={setServerPage}
          pageSize={5}
          pageSizes={[5]}
          total={ORDERS.length}
        />
      </Specimen>
      <Specimen title="Densidad compacta y encabezado fijo">
        <DataTable label="Pedidos compactos" columns={columns} rows={ORDERS} getRowId={(o) => o.id} density="compact" stickyHeader />
      </Specimen>
      <Specimen title="Cargando">
        <DataTable label="Pedidos cargando" columns={columns} rows={[]} getRowId={(o) => o.id} selectable loading rowActions={actions} pageSize={8} />
      </Specimen>
      <Specimen title="Vacío">
        <DataTable
          label="Pedidos vacíos"
          columns={columns}
          rows={[]}
          getRowId={(o) => o.id}
          empty={<EmptyState icon="Search" title="Sin resultados" action={<Button variant="secondary">Limpiar filtros</Button>}>Ningún pedido coincide con los filtros.</EmptyState>}
        />
      </Specimen>
    </>
  );
}

export function ComposedSection() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const rows = ORDERS.filter((o) => o.client.toLowerCase().includes(q.toLowerCase()) && (!status || o.status === status));
  return (
    <>
      <Specimen title="PageHeader" note="Título, descripción, acciones y migas.">
        <PageHeader
          title="Pedidos"
          description="Revisa, filtra y gestiona los pedidos de la tienda."
          breadcrumbs={[{ label: "Inicio", href: "#compuestos" }, { label: "Tiendas", href: "#compuestos" }, { label: "Pedidos" }]}
          actions={<><Button variant="outline">Exportar</Button><Button>Nuevo pedido</Button></>}
        />
      </Specimen>
      <Specimen title="Página de lista de ejemplo" note="PageHeader + ListToolbar + DataTable + EmptyState. Escribe para filtrar.">
        <div className="ui-stack">
          <PageHeader title="Pedidos" actions={<Button>Nuevo pedido</Button>} />
          <Card>
            <ListToolbar
              search={{ label: "Buscar pedido", placeholder: "Buscar por cliente", value: q, onValueChange: setQ }}
              filters={[{ name: "estado", label: "Estado", placeholder: "Todos los estados", options: statuses.map((s) => ({ value: s, label: s })), value: status ?? "", onValueChange: setStatus }]}
              submitLabel={false}
              onSubmit={(e) => e.preventDefault()}
            />
            <DataTable
              label="Pedidos filtrados"
              columns={columns}
              rows={rows}
              getRowId={(o) => o.id}
              pageSize={8}
              rowActions={actions}
              empty={<EmptyState icon="Search" title="Sin coincidencias" action={<Button variant="secondary" onClick={() => (setQ(""), setStatus(null))}>Limpiar filtros</Button>}>Prueba con otro nombre o estado.</EmptyState>}
            />
          </Card>
        </div>
      </Specimen>
      <Specimen title="EmptyState">
        <Card>
          <EmptyState icon="Inbox" title="Aún no tienes pedidos" action={<Button>Nuevo pedido</Button>}>
            Crea el primero para empezar a vender.
          </EmptyState>
        </Card>
      </Specimen>
      <Specimen title="Migas dentro de la página"><Breadcrumbs items={[{ label: "Inicio", href: "#compuestos" }, { label: "Pedidos" }]} /></Specimen>
    </>
  );
}

type FormState = { error?: string; saved?: boolean };

async function saveAction(_: FormState, data: FormData): Promise<FormState> {
  await new Promise((r) => setTimeout(r, 1200));
  return String(data.get("name") ?? "").trim() ? { saved: true } : { error: "Escribe el nombre para guardar." };
}

export function FormSection() {
  const [state, action] = useActionState(saveAction, {});
  return (
    <Specimen title="FormShell" note="Campos, error general y botón «Guardando…». Envía vacío para ver el error.">
      <Card>
        <FormShell action={action} error={state.error} cancel={<Button variant="secondary">Cancelar</Button>}>
          <Field label="Nombre" htmlFor="fs-name"><Input id="fs-name" name="name" /></Field>
          <Field label="Categoría" htmlFor="fs-cat"><Select id="fs-cat" name="cat" options={categorias} defaultValue="cafe" /></Field>
          {state.saved && <p className="hint" role="status">Guardado.</p>}
        </FormShell>
      </Card>
    </Specimen>
  );
}
