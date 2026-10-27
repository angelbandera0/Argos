import { contrast, resolve, tokens } from "../tokens";
import { Specimen } from "../gallery";

export function Colores() {
  const ink = resolve("var(--color-ink)");
  const white = resolve("var(--color-surface)");
  return (
    <Specimen title="Tokens de color" note="Nombre, valor y par de contraste.">
      <div className="ui-grid">
        {tokens("--color-").map(({ name, value }) => {
          const hex = resolve(value);
          const isHex = /^#[0-9a-fA-F]{6}$/.test(hex);
          const withInk = isHex ? contrast(hex, ink) : 0;
          const withWhite = isHex ? contrast(hex, white) : 0;
          const useInk = withInk >= withWhite;
          const ratio = Math.max(withInk, withWhite);
          return (
            <div className="ui-swatch" key={name}>
              <div
                className="ui-swatch-color"
                style={{ background: `var(${name})`, color: `var(${useInk ? "--color-ink" : "--color-surface"})` }}
              >
                <span>Aa</span>
                <span className="caption" style={{ color: "inherit" }}>
                  {isHex ? `${useInk ? "Tinta" : "Blanco"} ${ratio.toFixed(2)}:1 ${ratio >= 4.5 ? "AA" : "sin AA"}` : "Con transparencia"}
                </span>
              </div>
              <div className="ui-swatch-meta">
                <code>{name}</code>
                <span className="caption">{value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Specimen>
  );
}
