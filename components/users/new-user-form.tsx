"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { checkUsernameAction, createUserAction, type NewUserState } from "@/app/(app)/usuarios/actions";
import { Check, Lock } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button-class";
import { CheckboxBox } from "@/components/ui/checkbox";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-section";
import { FormShell, FormSubmit } from "@/components/ui/form-shell";
import { PinSlots } from "@/components/ui/pin-slots";
import { Select } from "@/components/ui/select";
import { Checklist, SummaryCard, SummaryPanel } from "@/components/ui/summary-panel";
import { NAV_ICONS } from "@/components/icons";
import { UserCreatedDialog } from "./user-created-dialog";
import { checklist, cleanUsername, groupBySite, groupState, suggestUsername, usernameFormat } from "./user-form-logic";

type Role = { id: string; name: string; permissions: string[] };
type Store = { id: string; name: string; site: string };

export function NewUserForm({ code, companyName, roles, stores }: { code: string; companyName: string; roles: Role[]; stores: Store[] }) {
  const [state, action, pending] = useActionState<NewUserState, FormData>(createUserAction, {});
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [roleId, setRoleId] = useState("");
  const [on, setOn] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<{ name: string; available: boolean } | null>(null);
  const [closedId, setClosedId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const format = usernameFormat(username);
  const available = format === "ok" && checked?.name === username ? checked.available : undefined;
  const role = roles.find((r) => r.id === roleId);
  const groups = groupBySite(stores);
  const chosen = stores.filter((s) => on.has(s.id));
  const suggestion = username ? "" : suggestUsername(displayName);
  const { items, complete } = checklist({ name: displayName, username: available ? "ok" : "other", hasRole: !!role, stores: on.size });

  useEffect(() => {
    if (format !== "ok") return;
    const t = setTimeout(async () => {
      const r = await checkUsernameAction(username);
      setChecked({ name: username, available: r.available });
    }, 350);
    return () => clearTimeout(t);
  }, [format, username]);

  const setStores = (ids: string[], value: boolean) =>
    setOn((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (value) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const status =
    format === "invalid"
      ? { tone: "bad", text: "Usa de 2 a 24 letras minúsculas, números, guion o guion bajo." }
      : available === true
        ? { tone: "ok", text: `${code}.${username} está disponible.` }
        : available === false
          ? { tone: "bad", text: `${code}.${username} ya existe.` }
          : format === "ok"
            ? { tone: "", text: "Comprobando…" }
            : { tone: "", text: "Con este nombre entrará con su PIN." };

  function reset() {
    setDisplayName("");
    setUsername("");
    setRoleId("");
    setOn(new Set());
    setChecked(null);
    setFormKey((k) => k + 1);
  }

  return (
    <>
      <FormShell
        key={formKey}
        action={action}
        error={state.error}
        onSubmit={(e) => {
          if (!complete) e.preventDefault();
        }}
        aside={
          <SummaryPanel
            eyebrow="Así entrará"
            identity={
              <div className="ui-access-card">
                <Avatar name={displayName || "?"} size="md" />
                <strong data-empty={!displayName.trim() || undefined}>{displayName.trim() || "Sin nombre"}</strong>
                <Chip className="ui-username">
                  <span className="ui-username-prefix">{code}.</span>
                  {username || "usuario"}
                </Chip>
                <PinSlots data-empty />
                <span className="hint">
                  <Lock aria-hidden="true" />
                  PIN de 6 dígitos: se genera al crear
                </span>
              </div>
            }
            actions={
              <>
                <FormSubmit label="Crear usuario y generar PIN" pendingLabel="Creando…" size="lg" pending={pending} disabled={!complete} />
                <Link className={buttonClass("secondary", "lg")} href="/usuarios">
                  Cancelar
                </Link>
              </>
            }
          >
            <SummaryCard
              rows={[
                { label: "Rol", value: role ? <Chip variant="alert">{role.name}</Chip> : "Sin elegir" },
                { label: "Tiendas", value: chosen.length ? chosen.map((s) => <Chip key={s.id}>{s.name}</Chip>) : "Ninguna" },
              ]}
            />
            <Checklist items={items} />
          </SummaryPanel>
        }
      >
        <input type="hidden" name="name" value={username} />
        <input type="hidden" name="roleId" value={roleId} />
        {chosen.map((s) => (
          <input key={s.id} type="hidden" name="storeId" value={s.id} />
        ))}

        <FormSection n={1} title="Datos de acceso" description="Quién es, con qué nombre entrará y qué podrá hacer.">
          <div className="ui-form-section-cols">
            <Field label="Nombre" htmlFor="displayName" hint="Así se verá en ventas e historial.">
              <Input
                id="displayName"
                name="displayName"
                autoComplete="off"
                maxLength={80}
                placeholder="Ej. Marta López"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                aria-describedby="displayName-hint"
              />
            </Field>
            <div className="field">
              <label htmlFor="username">Nombre de usuario</label>
              <div className="ui-username-field" data-invalid={format === "invalid" || available === false || undefined}>
                <span aria-hidden="true">{code}.</span>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(cleanUsername(e.target.value))}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={24}
                  placeholder="marta"
                  aria-label={`Nombre de usuario (prefijo ${code}.)`}
                  aria-invalid={format === "invalid" || available === false || undefined}
                  aria-describedby="username-status"
                />
                {available === true && (
                  <span className="ui-username-ok" aria-hidden="true">
                    <Check />
                  </span>
                )}
              </div>
              <p id="username-status" role="status" className="ui-username-status" data-tone={status.tone || undefined}>
                {status.text}
                {suggestion && (
                  <>
                    {" "}
                    Sugerencia:{" "}
                    <Chip variant="alert" className="ui-suggestion" role="button" tabIndex={0} onClick={() => setUsername(suggestion)} onKeyDown={(e) => e.key === "Enter" && setUsername(suggestion)}>
                      {code}.{suggestion}
                    </Chip>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="field">
            <div className="ui-user-label-row">
              <label htmlFor="roleId">Rol</label>
              <Link href="/roles">Ver roles</Link>
            </div>
            <Select
              id="roleId"
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Elige un rol"
              value={roleId || null}
              onValueChange={(v) => setRoleId(v ?? "")}
              aria-describedby="roleId-hint"
            />
            {role ? (
              <div className="ui-role-strip" id="roleId-hint">
                <span aria-hidden="true">
                  <NAV_ICONS.KeyRound />
                </span>
                <p>{role.permissions.length ? "En Productos podrá:" : "Solo podrá iniciar sesión."}</p>
                <div>
                  {role.permissions.map((p) => (
                    <Chip key={p} variant="alert" icon="Check">
                      {p}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <span className="hint" id="roleId-hint">
                Decide qué podrá hacer. Puedes cambiarlo después.
              </span>
            )}
          </div>

          <p className="ui-note">
            El prefijo <code>{code}.</code> es fijo e identifica a {companyName}. Solo minúsculas, números, guion y guion bajo.
          </p>
        </FormSection>

        <FormSection
          n={2}
          title="Tiendas"
          description="Solo podrá iniciar sesión en las tiendas que marques."
          aside={<Chip variant={on.size === 0 ? "danger" : undefined}>{on.size} de {stores.length}</Chip>}
        >
          {on.size === 0 && <p className="hint">Marca al menos una tienda.</p>}
          {groups.map((g) => {
            const ids = g.stores.map((s) => s.id);
            const n = ids.filter((id) => on.has(id)).length;
            const gs = groupState(n, ids.length);
            return (
              <div key={g.site} className="ui-store-group" role="group" aria-label={g.site}>
                <label className="ui-store-group-head">
                  <CheckboxBox
                    checked={gs === "all"}
                    indeterminate={gs === "some"}
                    onCheckedChange={(c) => setStores(ids, c)}
                    aria-label={`Todas las tiendas de ${g.site}`}
                  />
                  <strong>{g.site}</strong>
                  <span className="hint">{n} de {ids.length}</span>
                </label>
                <div className="ui-store-grid">
                  {g.stores.map((s) => (
                    <ChoiceCard key={s.id} title={s.name} checked={on.has(s.id)} onCheckedChange={(c) => setStores([s.id], c)} />
                  ))}
                </div>
              </div>
            );
          })}
        </FormSection>
      </FormShell>
      {state.pin && state.userId && state.userId !== closedId && (
        <UserCreatedDialog
          name={state.displayName ?? displayName}
          username={`${code}.${state.name ?? username}`}
          pin={state.pin}
          roleName={role?.name ?? ""}
          storeNames={chosen.map((s) => s.name)}
          userId={state.userId}
          onAnother={() => {
            setClosedId(state.userId ?? null);
            reset();
          }}
        />
      )}
    </>
  );
}
