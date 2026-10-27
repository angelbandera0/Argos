import { tokens } from "../tokens";
import { Specimen } from "../gallery";

const tracking: Record<string, string> = { "card-title-lg": "card-title" };
const samples: Record<string, string> = { "kpi-xl": "$7.640", kpi: "$7.640", stat: "$41,08", avatar: "AB", overline: "VENTAS HOY", brand: "Argos" };

export function Tipografia() {
  const tk = tokens("--tracking-").map((t) => t.name);
  return (
    <Specimen title="Roles tipográficos" note="--text-* con su tracking cuando existe.">
      {tokens("--text-").map(({ name, value }) => {
        const role = name.replace("--text-", "");
        const track = `--tracking-${tracking[role] ?? role}`;
        return (
          <div className="ui-type" key={name}>
            <p
              className="ui-type-sample"
              style={{ font: `var(${name})`, letterSpacing: tk.includes(track) ? `var(${track})` : undefined, textTransform: role === "overline" ? "uppercase" : undefined }}
            >
              {samples[role] ?? "Hoy vendimos más que ayer"}
            </p>
            <span className="caption">
              <code>{name}</code> · {value}
            </span>
          </div>
        );
      })}
    </Specimen>
  );
}
