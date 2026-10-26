import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { SidebarItem, SidebarSection, SidebarSubmenu } from "@/components/ui/sidebar-section";
import { Steps } from "@/components/ui/steps";
import { Tabs } from "@/components/ui/tabs";
import { CompanySelector } from "@/components/org/company-selector";
import { Specimen } from "../gallery";
import { StepsDemo } from "./navegacion-demo";

const body = <p className="muted">Contenido de la pestaña seleccionada.</p>;

export function TabsSection() {
  return (
    <>
      <Specimen title="Subrayadas" note="Secciones de una página. Flechas ←/→ para moverse; con contador y una desactivada.">
        <Tabs
          aria-label="Secciones del producto"
          defaultValue="info"
          items={[
            { value: "info", label: "Información", content: body },
            { value: "stock", label: "Inventario", count: 12, content: body },
            { value: "hist", label: "Historial", count: 3, content: body },
            { value: "off", label: "Reportes", disabled: true, content: body },
          ]}
        />
      </Specimen>
      <Specimen title="Segmentadas" note="Cambiar de vista o periodo; máximo 4 opciones cortas.">
        <Tabs
          variant="segmented"
          aria-label="Periodo"
          defaultValue="semana"
          items={[
            { value: "hoy", label: "Hoy", content: body },
            { value: "semana", label: "Semana", content: body },
            { value: "mes", label: "Mes", count: 4, content: body },
          ]}
        />
      </Specimen>
    </>
  );
}

export function BreadcrumbsSection() {
  const base = [{ label: "Compañías", href: "#breadcrumbs" }, { label: "Casa Matriz", href: "#breadcrumbs" }];
  return (
    <>
      <Specimen title="Simple">
        <Breadcrumbs items={[...base, { label: "Sede norte" }]} />
      </Specimen>
      <Specimen title="Con inicio" note="El primer nivel es el botón circular de la casa.">
        <Breadcrumbs withHome items={[{ label: "Inicio", href: "#breadcrumbs" }, ...base, { label: "Sede norte" }]} />
      </Specimen>
      <Specimen title="Colapsado" note="Más de 4 niveles: primero, «…» con menú y los dos últimos. En móvil solo «Nivel anterior».">
        <Breadcrumbs
          items={[
            { label: "Compañías", href: "#breadcrumbs" },
            { label: "Casa Matriz", href: "#breadcrumbs" },
            { label: "Sede norte", href: "#breadcrumbs" },
            { label: "Tienda 1", href: "#breadcrumbs" },
            { label: "Caja 2", href: "#breadcrumbs" },
            { label: "Turno de hoy" },
          ]}
        />
      </Specimen>
    </>
  );
}

export function StepsSection() {
  return (
    <>
      <Specimen title="Horizontal interactivo" note="Atrás, Siguiente y un paso con error.">
        <StepsDemo orientation="horizontal" />
      </Specimen>
      <Specimen title="Vertical" note="El paso actual despliega su contenido.">
        <StepsDemo orientation="vertical" />
      </Specimen>
      <Specimen title="Estados fijos">
        <div className="ui-panel">
          <Steps current={2} errorIndex={2} steps={[{ title: "Carrito" }, { title: "Envío" }, { title: "Pago", description: "Pago rechazado" }, { title: "Listo" }]} />
        </div>
      </Specimen>
    </>
  );
}

export function AccordionSection() {
  const text = <p>Detalle de la sección. Puede contener cualquier contenido.</p>;
  return (
    <>
      <Specimen title="Lista" note="Una sección abierta a la vez.">
        <Accordion
          defaultValue={["a"]}
          items={[
            { value: "a", title: "¿Cómo abro un turno?", content: text },
            { value: "b", title: "¿Cómo cierro la caja?", content: text },
            { value: "c", title: "¿Quién puede anular una venta?", content: text },
          ]}
        />
      </Specimen>
      <Specimen title="Tarjetas" note="Varias abiertas, con subtítulo, insignia y acción.">
        <Accordion
          variant="cards"
          multiple
          defaultValue={["a", "b"]}
          items={[
            { value: "a", title: "Datos generales", subtitle: "Nombre y código", content: text },
            { value: "b", title: "Contacto", subtitle: "Falta un dato", badge: <Badge variant="warning">Pendiente</Badge>, action: <Button variant="ghost" size="sm">Editar</Button>, content: text },
            { value: "c", title: "Impuestos", subtitle: "Sin configurar", content: text },
          ]}
        />
      </Specimen>
      <Specimen title="Con icono y resumen" note="Una abierta; la última está desactivada.">
        <Accordion
          variant="rich"
          defaultValue={["a"]}
          items={[
            { value: "a", icon: "Box", title: "Turno de mañana", subtitle: "08:00 – 14:00", summary: "$1.240", badge: <Badge variant="success">Cerrado</Badge>, content: text },
            { value: "b", icon: "Users", title: "Turno de tarde", subtitle: "14:00 – 20:00", summary: "$980", badge: <Badge variant="warning">Abierto</Badge>, content: text },
            { value: "c", icon: "Tags", title: "Turno de noche", subtitle: "Sin abrir", disabled: true, content: text },
          ]}
        />
      </Specimen>
    </>
  );
}

export function SidebarGallerySection() {
  return (
    <Specimen title="Secciones, insignias, punto y submenú" note="Reduce la ventana a menos de 1280 px para ver el riel (insignias como punto).">
      <div className="ui-sidebar-demo">
        <SidebarSection title="Menú">
          <SidebarItem href="#sidebar" label="Inicio" icon="LayoutDashboard" active />
          <SidebarItem href="#sidebar" label="Pedidos" icon="Box" badge={{ kind: "count", text: "12" }} />
          <SidebarItem href="#sidebar" label="Inventario" icon="Tags" badge={{ kind: "alert", text: "3" }} />
          <SidebarItem href="#sidebar" label="Mensajes" icon="Bell" dot />
        </SidebarSection>
        <SidebarSection title="Gestión" collapsible>
          <SidebarItem href="#sidebar" label="Reportes" icon="Building2" badge={{ kind: "new", text: "NUEVO" }} />
          <SidebarSubmenu
            label="Catálogo"
            icon="Box"
            defaultOpen
            items={[
              { href: "#sidebar", label: "Productos", active: true },
              { href: "#sidebar", label: "Categorías" },
            ]}
          />
        </SidebarSection>
        <SidebarSection title="Configuración" collapsible defaultOpen={false}>
          <SidebarItem href="#sidebar" label="Roles" icon="KeyRound" />
          <SidebarItem href="#sidebar" label="Usuarios" icon="Users" />
        </SidebarSection>
      </div>
    </Specimen>
  );
}

const COMPANIES = [
  { id: "1", name: "La Nacion", code: "717d" },
  { id: "2", name: "La Casona", code: "qbt6" },
  { id: "3", name: "Casa Norte", code: "k3m9" },
];

export function CompanySelectorSection() {
  return (
    <>
      <Specimen title="Cerrado y abierto" note="Pulsa para abrir; flechas, Escape y clic fuera funcionan. Elegir una compañía llama a la acción real de cookie (en la galería no hay sesión).">
        <div className="ui-sidebar-demo">
          <CompanySelector companies={COMPANIES} activeId="1" />
        </div>
      </Specimen>
      <Specimen title="Una sola compañía" note="Sigue visible; el popover lista esa compañía y «Gestionar compañías».">
        <div className="ui-sidebar-demo">
          <CompanySelector companies={COMPANIES.slice(0, 1)} activeId="1" />
        </div>
      </Specimen>
      <Specimen title="Sin compañías" note="No ocupa espacio (el componente no pinta nada).">
        <div className="ui-sidebar-demo">
          <CompanySelector companies={[]} />
          <span className="caption">Nada que mostrar arriba.</span>
        </div>
      </Specimen>
    </>
  );
}
