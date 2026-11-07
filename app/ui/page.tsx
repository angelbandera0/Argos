import { notFound } from "next/navigation";
import { Section } from "./gallery";
import { Colores } from "./sections/colores";
import { Tipografia } from "./sections/tipografia";
import { Espaciado } from "./sections/espaciado";
import { Componentes } from "./sections/componentes";
import { AlertasSection, BannerSection, DialogosSection, InsigniasSection, ToastSection, TooltipSection } from "./sections/avisos";
import { AccordionSection, BreadcrumbsSection, CompanySelectorSection, SidebarGallerySection, StepsSection, TabsSection } from "./sections/navegacion";
import { ComposedSection, DatatableSection, FormSection } from "./sections/datos";
import { DatepickerSection } from "./sections/fechas";
import { FiltrosSection, HistorialSection } from "./sections/historial";
import { BotonesSection, CamposSection, ChecksSection, SelectSection, MultiselectSection } from "./sections/entradas";
import { EntityCardSection, ViewToggleSection } from "./sections/entity-card";
import { StatTileSection } from "./sections/stat-tile";
import { EntityPanelSection } from "./sections/entity-panel";
import { PagerSection } from "./sections/pager";
import { UrlPagerSection } from "./sections/url-pager";
import { FormSectionSection } from "./sections/form-section";
import { SummaryPanelSection } from "./sections/summary-panel";
import { ChoiceCardSection } from "./sections/choice-card";
import { PinSlotsSection } from "./sections/pin-slots";
import { ToggleCardSection } from "./sections/toggle-card";
import { SalesPreviewSection } from "./sections/sales-preview";
import { QuantityInputSection } from "./sections/quantity-input";
import { LotPickerSection } from "./sections/lot-picker";
import { StatusBadgeSection } from "./sections/status-badge";
import { StateTimelineSection } from "./sections/state-timeline";
import { SpendSummarySection } from "./sections/spend-summary";
import { StockCoverageSection } from "./sections/stock-coverage";
import { DecisionsBarSection } from "./sections/decisions-bar";
import { StoreSplitSection } from "./sections/store-split";
import { ThreeQtyTableSection } from "./sections/three-qty-table";
import { SegmentedControlSection } from "./sections/segmented-control";
import { ViewStateSection } from "./sections/view-state";
import { MoneyValueSection } from "./sections/money-value";
import { DenominationRowSection } from "./sections/denomination-row";
import { QuantityPickerSection } from "./sections/quantity-picker";

export const metadata = { title: "Argos UI — galería" };

const sections = [
  { id: "colores", title: "Colores", description: "Cada muestra usa su token; el par de contraste es el mejor entre tinta y blanco.", content: <Colores /> },
  { id: "tipografia", title: "Tipografía", description: "Escala reducida vigente. Redimensiona la ventana para ver tablet y móvil.", content: <Tipografia /> },
  { id: "espaciado", title: "Espaciado, radios y sombras", content: <Espaciado /> },
  { id: "componentes", title: "Componentes existentes", description: "Pasa el cursor y usa Tab para ver hover y foco.", content: <Componentes /> },
  { id: "botones", title: "Botones", description: "Variantes, tamaños y estados (guía §6.1).", content: <BotonesSection /> },
  { id: "campos", title: "Campos de texto", description: "Input y Textarea con Field (guía §6.17).", content: <CamposSection /> },
  { id: "datepicker", title: "Datepicker", description: "Fecha única y rango (guía §6.34). Cadenas ISO, escribible, popover Base UI.", content: <DatepickerSection /> },
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
  { id: "filtros", title: "FilterBar, FilterPill y Avatar", description: "Barra de filtros de una página (guía §6.35).", content: <FiltrosSection /> },
  { id: "historial", title: "AuditTable e Historial", description: "Tabla de auditoría agrupada por día (guía §6.36) y página completa (H-01/H-02).", content: <HistorialSection /> },
  { id: "formshell", title: "FormShell", description: "Formulario de ejemplo.", content: <FormSection /> },
  { id: "entity-card", title: "EntityCard", description: "Tarjeta de entidad en tres franjas (guía §6.37).", content: <EntityCardSection /> },
  { id: "view-toggle", title: "ViewToggle", description: "Conmutador grilla/lista (guía §6.37).", content: <ViewToggleSection /> },
  { id: "stat-tile", title: "StatTile", description: "Indicador con icono rojo en círculo blanco y cifra (§6.37).", content: <StatTileSection /> },
  { id: "entity-panel", title: "EntityPanel", description: "Bloque de filas dentro de una tarjeta de entidad (TIENDAS · n).", content: <EntityPanelSection /> },
  { id: "pager", title: "Pager", description: "Paginación Anterior · páginas · Siguiente con «Mostrando a–b de n».", content: <PagerSection /> },
  { id: "url-pager", title: "UrlPager", description: "Pager que guarda la página en ?pagina de la URL, conservando los demás filtros.", content: <UrlPagerSection /> },
  { id: "form-section", title: "FormSection", description: "Tarjeta de formulario con número en círculo, título, descripción y slot a la derecha (contador). §6.38.", content: <FormSectionSection /> },
  { id: "summary-panel", title: "SummaryPanel", description: "Panel lateral sticky de un formulario: icono + nombre, tarjeta de resumen, lista de comprobación y acciones. §6.38.", content: <SummaryPanelSection /> },
  { id: "choice-card", title: "ChoiceCard y ChoicePills", description: "Tarjeta seleccionable con checkbox (fila «todas» con estado mixto) y radio en píldoras para 2–6 opciones. §6.38.", content: <ChoiceCardSection /> },
  { id: "pin-slots", title: "PinSlots", description: "Seis casillas de PIN: punteadas, con dígitos u ocultas", content: <PinSlotsSection /> },
  { id: "toggle-card", title: "ToggleCard", description: "Tarjeta-interruptor de ancho completo (role=switch): icono, título, ayuda y interruptor; activo en fondo success-tint.", content: <ToggleCardSection /> },
  { id: "sales-preview", title: "SalesPreview", description: "Vista previa de la pantalla de caja: chip de categoría y tarjeta del producto; pausado al 60 % con chip «Pausado».", content: <SalesPreviewSection /> },
  { id: "quantity-input", title: "QuantityInput", description: "Cantidad + presentación + equivalente en unidad base (§6.43).", content: <QuantityInputSection /> },
  { id: "lot-picker", title: "LotPicker", description: "Reparto de cantidad entre lotes con sugerido PEPS (§6.44).", content: <LotPickerSection /> },
  { id: "status-badge", title: "StatusBadge", description: "Insignias de 26 px con icono: existencia, línea, solicitud y pedido (§6.45).", content: <StatusBadgeSection /> },
  { id: "state-timeline", title: "StateTimeline", description: "Línea de tiempo horizontal y vertical (§6.46).", content: <StateTimelineSection /> },
  { id: "spend-summary", title: "SpendSummary", description: "Entregado · Gastado · Sobrante con gasto por producto (§6.47).", content: <SpendSummarySection /> },
  { id: "stock-coverage", title: "StockCoverage", description: "Barra de cobertura de stock con chip «Cubre todo / parte / Sin existencia» (§6.48).", content: <StockCoverageSection /> },
  { id: "decisions-bar", title: "DecisionsBar", description: "Píldora sticky de decisiones pendientes; barra oscura compacta en móvil (§6.49).", content: <DecisionsBarSection /> },
  { id: "store-split", title: "StoreSplit", description: "Reparto de una cantidad entre tiendas con chip «Cuadra / Faltan» (§6.50).", content: <StoreSplitSection /> },
  { id: "three-qty-table", title: "ThreeQtyTable", description: "Pedida · Reportada · Recibida editable con diferencia resaltada y costos opcionales (§6.52).", content: <ThreeQtyTableSection /> },
  { id: "segmented-control", title: "SegmentedControl", description: "Segmentado de una sola opción (radiogroup), p. ej. decimales.", content: <SegmentedControlSection /> },
  { id: "view-state", title: "ViewState", description: "Cinco estados de vista: cargando, vacío, sin coincidencias, error y sin permiso (M8).", content: <ViewStateSection /> },
  { id: "money-value", title: "MoneyValue", description: "Importe con formato de divisa, «Sin costo conocido» y variante sin costos (M3).", content: <MoneyValueSection /> },
  { id: "denomination-row", title: "DenominationRow", description: "Fila de denominación: etiqueta de valor amarilla suave, importe con símbolo, tipo y acciones a la derecha (M2).", content: <DenominationRowSection /> },
  { id: "quantity-picker", title: "QuantityPicker", description: "Cantidad + unidad con equivalente en base (entradas, traslados).", content: <QuantityPickerSection /> },
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
