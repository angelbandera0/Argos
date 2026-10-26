import { notFound } from "next/navigation";
import { Section } from "./gallery";
import { Colores } from "./sections/colores";
import { Tipografia } from "./sections/tipografia";
import { Espaciado } from "./sections/espaciado";
import { Componentes } from "./sections/componentes";
import { AlertasSection, BannerSection, DialogosSection, InsigniasSection, ToastSection, TooltipSection } from "./sections/avisos";
import { AccordionSection, BreadcrumbsSection, CompanySelectorSection, SidebarGallerySection, StepsSection, TabsSection } from "./sections/navegacion";
import { ComposedSection, DatatableSection, FormSection } from "./sections/datos";
import { HistorialSection } from "./sections/historial";
import { BotonesSection, CamposSection, ChecksSection, SelectSection, MultiselectSection } from "./sections/entradas";

export const metadata = { title: "Argos UI — galería" };

const sections = [
  { id: "colores", title: "Colores", description: "Cada muestra usa su token; el par de contraste es el mejor entre tinta y blanco.", content: <Colores /> },
  { id: "tipografia", title: "Tipografía", description: "Escala reducida vigente. Redimensiona la ventana para ver tablet y móvil.", content: <Tipografia /> },
  { id: "espaciado", title: "Espaciado, radios y sombras", content: <Espaciado /> },
  { id: "componentes", title: "Componentes existentes", description: "Pasa el cursor y usa Tab para ver hover y foco.", content: <Componentes /> },
  { id: "botones", title: "Botones", description: "Variantes, tamaños y estados (guía §6.1).", content: <BotonesSection /> },
  { id: "campos", title: "Campos de texto", description: "Input y Textarea con Field (guía §6.17).", content: <CamposSection /> },
  { id: "casillas", title: "Casillas, radio e interruptores", description: "Guía §6.18.", content: <ChecksSection /> },
  { id: "select", title: "Select", description: "Base UI Select (guía §6.19).", content: <SelectSection /> },
  { id: "multiselect", title: "Multiselect", description: "Base UI Combobox múltiple (guía §6.20).", content: <MultiselectSection /> },
  { id: "alertas", title: "Alertas", description: "En línea y compacta (guía §6.21).", content: <AlertasSection /> },
  { id: "banner", title: "Banner", description: "Guía §6.22.", content: <BannerSection /> },
  { id: "toast", title: "Toast", description: "Base UI Toast (guía §6.23).", content: <ToastSection /> },
  { id: "dialogos", title: "Diálogos", description: "Base UI Dialog y AlertDialog (guía §6.24).", content: <DialogosSection /> },
  { id: "insignias", title: "Insignias y chips", description: "Guía §6.25.", content: <InsigniasSection /> },
  { id: "tooltip", title: "Tooltip", description: "Base UI Tooltip (guía §6.26).", content: <TooltipSection /> },
  { id: "tabs", title: "Tabs", description: "Base UI Tabs (guía §6.28).", content: <TabsSection /> },
  { id: "breadcrumbs", title: "Breadcrumbs", description: "Guía §6.29.", content: <BreadcrumbsSection /> },
  { id: "steps", title: "Steps", description: "Guía §6.30.", content: <StepsSection /> },
  { id: "accordion", title: "Accordion", description: "Base UI Accordion (guía §6.31).", content: <AccordionSection /> },
  { id: "sidebar", title: "Secciones del sidebar", description: "Guía §6.32; el panel real ya las usa.", content: <SidebarGallerySection /> },
  { id: "selector-compania", title: "Selector de compañía", description: "Panel lateral; en riel solo avatar, en móvil avatar en la barra superior [decisión del usuario].", content: <CompanySelectorSection /> },
  { id: "datatable", title: "Datatable", description: "Tabla genérica DataTable<T> (guía §6.33).", content: <DatatableSection /> },
  { id: "compuestos", title: "PageHeader, ListToolbar y EmptyState", description: "Compuestos de página montados juntos.", content: <ComposedSection /> },
  { id: "historial", title: "Historial", description: "Tabla de operaciones y detalle de cambios (H-01).", content: <HistorialSection /> },
  { id: "formshell", title: "FormShell", description: "Formulario de ejemplo.", content: <FormSection /> },
];

export default function UiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="ui-gallery">
      <nav className="ui-index" aria-label="Índice de la galería">
        <span className="eyebrow">Argos UI</span>
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="ui-main">
        <h1 className="ui-title">Galería de componentes</h1>
        {sections.map((s) => (
          <Section key={s.id} id={s.id} title={s.title} description={s.description}>
            {s.content}
          </Section>
        ))}
      </main>
    </div>
  );
}
