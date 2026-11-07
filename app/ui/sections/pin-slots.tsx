import { PinSlots } from "@/components/ui/pin-slots";
import { Specimen } from "../gallery";

export function PinSlotsSection() {
  return (
    <>
      <Specimen title="Vacío (sm)">
        <PinSlots />
      </Specimen>
      <Specimen title="Dígitos (lg)">
        <PinSlots size="lg" value="482915" />
      </Specimen>
      <Specimen title="Oculto (lg)">
        <PinSlots size="lg" value="482915" hidden />
      </Specimen>
    </>
  );
}
