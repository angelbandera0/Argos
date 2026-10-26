import { notFound } from "next/navigation";
import { Section } from "./gallery";
import { Colores } from "./sections/colores";
import { Tipografia } from "./sections/tipografia";
import { Espaciado } from "./sections/espaciado";
import { Componentes } from "./sections/componentes";

export const metadata = { title: "Argos UI — galería" };

const sections = [
  { id: "colores", title: "Colores", description: "Cada muestra usa su token; el par de contraste es el mejor entre tinta y blanco.", content: <Colores /> },
  { id: "tipografia", title: "Tipografía", description: "Escala reducida vigente. Redimensiona la ventana para ver tablet y móvil.", content: <Tipografia /> },
  { id: "espaciado", title: "Espaciado, radios y sombras", content: <Espaciado /> },
  { id: "componentes", title: "Componentes existentes", description: "Pasa el cursor y usa Tab para ver hover y foco.", content: <Componentes /> },
];

export default function UiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="ui-gallery">
      <nav className="ui-index" aria-label="Índice de la galería">
        <span className="overline">Argos UI</span>
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
