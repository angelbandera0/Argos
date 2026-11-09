"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { checkUsernameAction, createUserAction, type NewUserState, updateUserAction } from "@/app/(app)/usuarios/actions";
import { Check, Lock } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";
import { canSubmitStep } from "@/components/ui/step-guard";
import { buttonClass } from "@/components/ui/button-class";
import { CheckboxBox } from "@/components/ui/checkbox";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-section";
import { FormShell } from "@/components/ui/form-shell";
import { PinSlots } from "@/components/ui/pin-slots";
import { Select } from "@/components/ui/select";
import { Checklist, SummaryCard, SummaryPanel } from "@/components/ui/summary-panel";
import { UserCreatedDialog } from "./user-created-dialog";
import { RolePreview } from "./role-preview";
import { checklist, cleanUsername, groupBySite, groupState, type RolePreviewSource, rolePreview, stepForField, suggestUsername, type UserDraft, userComplete, userFields, userNextStep, userStepError, userStepKeys, userSteps, usernameFormat } from "./user-form-logic";

type Store = { id: string; name: string; site: string };

export function UserStepper({
  mode,
  userId,
  code,
  companyId,
  companyName,
  roles,
  stores,
  initial,
}: {
  mode: "create" | "edit";
  userId?: string;
  code: string;
  companyId: string;
  companyName: string;
  roles: RolePreviewSource[];
  stores: Store[];
  initial?: { roleId: string; storeIds: string[] };
}) {
  const [state, action, pending] = useActionState<NewUserState, FormData>(
    mode === "edit" && userId ? updateUserAction.bind(null, userId) : createUserAction,
    {},
  );
  const keys = userStepKeys(mode);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [roleId, setRoleId] = useState(initial?.roleId ?? "");
  const [on, setOn] = useState<Set<string>>(new Set(initial?.storeIds ?? []));
  const [checked, setChecked] = useState<{ name: string; available: boolean } | null>(null);
  const [closedId, setClosedId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [step, setStep] = useState(0);
  const [stepMsg, setStepMsg] = useState<string>();
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    const back = stepForField(keys, state.field);
    if (state.error && back >= 0) {
      setStep(back);
      setStepMsg(state.error);
    }
  }

  const format = usernameFormat(username);
  const available = format === "ok" && checked?.name === username ? checked.available : undefined;
  const role = roles.find((r) => r.id === roleId);
  const draft: UserDraft = {
    displayName,
    username,
    usernameAvailable: available,
    roleId,
    roleValid: !!role && (rolePreview(role, companyId)?.validForCompany ?? false),
    storeIds: [...on],
  };
  const lastStep = keys.length - 1;
  const key = keys[step];
  const complete = userComplete(keys, draft);
  const goNext = () => {
    const r = userNextStep(keys, step, draft);
    setStepMsg(r.error);
    setStep(r.step);
  };
  const guardedAction = (fd: FormData) => {
    if (canSubmitStep(step, lastStep)) action(fd);
  };
  const applySuggestion = () => {
    setStepMsg(undefined);
    setUsername(suggestion);
  };
  const groups = groupBySite(stores);
  const chosen = stores.filter((s) => on.has(s.id));
  const suggestion = username ? "" : suggestUsername(displayName);
  const { items } = checklist({ name: displayName, username: available ? "ok" : "other", hasRole: !!role, stores: on.size });

  useEffect(() => {
    if (format !== "ok") return;
    const t = setTimeout(async () => {
      const r = await checkUsernameAction(username);
      setChecked({ name: username, available: r.available });
    }, 350);
    return () => clearTimeout(t);
  }, [format, username]);

  const setStores = (ids: string[], value: boolean) => {
    setStepMsg(undefined);
    setOn((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (value) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

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
    setStep(0);
    setStepMsg(undefined);
    setFormKey((k) => k + 1);
  }

  const summaryRows = [
    ...(mode === "create"
      ? [
          { label: "Nombre", value: displayName.trim() || "Sin nombre" },
          { label: "Usuario", value: `${code}.${username || "usuario"}` },
        ]
      : []),
    { label: "Rol", value: role ? <Chip variant="alert">{role.name}</Chip> : "Sin elegir" },
    { label: "Tiendas", value: chosen.length ? chosen.map((s) => <Chip key={s.id}>{s.name}</Chip>) : "Ninguna" },
    ...(mode === "create" ? [{ label: "PIN", value: "Se genera al crear y se muestra una sola vez" }] : []),
  ];
  const dataError = !!stepMsg && key === "data";
  return (
    <>
      <FormShell
        key={formKey}
        action={guardedAction}
        error={state.error && stepForField(keys, state.field) < 0 ? state.error : undefined}
        onSubmit={(e) => {
          if (!canSubmitStep(step, lastStep)) {
            e.preventDefault();
            goNext();
          } else if (!complete) e.preventDefault();
        }}
        aside={
          <SummaryPanel
            eyebrow={mode === "create" ? "Así entrará" : "Cambios"}
            identity={
              mode === "create" ? (
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
              ) : undefined
            }
            actions={
              <Link className={buttonClass("secondary", "lg")} href="/usuarios">
                Cancelar
              </Link>
            }
          >
            <SummaryCard rows={summaryRows} />
            <Checklist items={mode === "create" ? items : items.slice(2)} />
          </SummaryPanel>
        }
      >
        {userFields({ displayName, username, roleId, storeIds: [...on] }, mode).map(([name, value], i) => (
          <input key={`${name}-${i}`} type="hidden" name={name} value={value} />
        ))}

        <Steps steps={userSteps(keys)} current={step} errorIndex={stepMsg ? step : undefined} aria-label="Pasos del usuario" />

        {key === "data" && (
          <FormSection n={step + 1} title="Datos de acceso" description="Quién es y con qué nombre entrará.">
            <div className="ui-form-section-cols">
              <Field label="Nombre" htmlFor="displayName" hint="Así se verá en ventas e historial.">
                <Input
                  id="displayName"
                  autoComplete="off"
                  maxLength={80}
                  placeholder="Ej. Marta López"
                  value={displayName}
                  onChange={(e) => {
                    setStepMsg(undefined);
                    setDisplayName(e.target.value);
                  }}
                  aria-describedby="displayName-hint"
                />
              </Field>
              <div className="field">
                <label htmlFor="username">Nombre de usuario</label>
                <div className="ui-username-field" data-invalid={format === "invalid" || available === false || dataError || undefined}>
                  <span aria-hidden="true">{code}.</span>
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setStepMsg(undefined);
                      setUsername(cleanUsername(e.target.value));
                    }}
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
                      <Chip variant="alert" className="ui-suggestion" role="button" tabIndex={0} onClick={applySuggestion} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applySuggestion())}>
                        {code}.{suggestion}
                      </Chip>
                    </>
                  )}
                </p>
              </div>
            </div>
            <p className="ui-note">
              El prefijo <code>{code}.</code> es fijo e identifica a {companyName}. Solo minúsculas, números, guion y guion bajo.
            </p>
          </FormSection>
        )}

        {key === "role" && (
          <FormSection n={step + 1} title="Rol" description="Decide qué podrá hacer en la aplicación.">
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
                onValueChange={(v) => {
                  setStepMsg(undefined);
                  setRoleId(v ?? "");
                }}
                aria-describedby="roleId-hint"
              />
            </div>
            <RolePreview role={role} companyId={companyId} companyName={companyName} />
          </FormSection>
        )}

        {key === "stores" && (
          <FormSection
            n={step + 1}
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
        )}

        {key === "summary" && (
          <FormSection n={step + 1} title="Resumen" description="Revisa todo antes de guardar.">
            <SummaryCard rows={summaryRows} />
            {!complete && (
              <Alert variant="danger">Completa los datos que faltan antes de guardar: vuelve atrás con el botón «Atrás».</Alert>
            )}
          </FormSection>
        )}

        {stepMsg && (
          <p className="error-text" role="alert">
            {stepMsg}
          </p>
        )}
        <div className="form-shell-actions">
          {step > 0 && (
            <Button
              key="back"
              type="button"
              variant="secondary"
              onClick={() => {
                setStepMsg(undefined);
                setStep(step - 1);
              }}
            >
              Atrás
            </Button>
          )}
          {step < lastStep ? (
            <Button key="next" type="button" onClick={goNext}>
              Siguiente
            </Button>
          ) : (
            <Button key="submit" type="submit" loading={pending} loadingLabel={mode === "create" ? "Creando…" : "Guardando…"} disabled={!complete}>
              {mode === "create" ? "Crear usuario" : "Guardar cambios"}
            </Button>
          )}
        </div>
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
