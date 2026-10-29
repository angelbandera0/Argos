import { Field, Input } from "@/components/ui/field";
import { Chip } from "@/components/ui/chip";
import { FormSection } from "@/components/ui/form-section";
import { Specimen } from "../gallery";

export function FormSectionSection() {
  return (
    <>
      <Specimen title="Sección numerada con contador">
        <FormSection n={1} title="Datos del rol" description="Cómo se llama y cuánto dura la sesión." aside={<Chip>2 de 2</Chip>}>
          <Field label="Nombre" htmlFor="gal-fs-name" hint="Así aparece al asignarlo.">
            <Input id="gal-fs-name" placeholder="Ej. Cajero" />
          </Field>
        </FormSection>
      </Specimen>
    </>
  );
}
