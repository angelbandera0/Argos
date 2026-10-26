import { tokens } from "../tokens";
import { Specimen } from "../gallery";

const Row = ({ name, value, children }: { name: string; value: string; children: React.ReactNode }) => (
  <div className="ui-token">
    <span>
      <code>{name}</code> <span className="caption">{value}</span>
    </span>
    {children}
  </div>
);

export function Espaciado() {
  return (
    <>
      <Specimen title="Espaciado" note="Base 4 px.">
        {tokens("--space-").map((t) => (
          <Row key={t.name} {...t}>
            <div className="ui-bar" style={{ width: `var(${t.name})` }} />
          </Row>
        ))}
      </Specimen>
      <Specimen title="Radios">
        {tokens("--radius-").map((t) => (
          <Row key={t.name} {...t}>
            <div className="ui-box" style={{ borderRadius: `var(${t.name})` }} />
          </Row>
        ))}
      </Specimen>
      <Specimen title="Sombras y anillos de foco">
        {[...tokens("--shadow-"), ...tokens("--focus-ring")].map((t) => (
          <Row key={t.name} {...t}>
            <div className="ui-box ui-box-shadow" style={{ borderRadius: "var(--radius-inner)", boxShadow: `var(${t.name})` }} />
          </Row>
        ))}
      </Specimen>
      <Specimen title="Tamaños">
        {tokens("--size-").map((t) => (
          <Row key={t.name} {...t}>
            <div className="ui-bar" style={{ width: `var(${t.name})` }} />
          </Row>
        ))}
      </Specimen>
      <Specimen title="Capas (z-index)">
        {tokens("--z-").map((t) => (
          <Row key={t.name} {...t}>
            <span />
          </Row>
        ))}
      </Specimen>
    </>
  );
}
