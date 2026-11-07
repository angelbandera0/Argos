import { DenominationRow } from "@/components/ui/denomination-row";
import { Switch } from "@/components/ui/switch";
import { Specimen } from "../gallery";

export function DenominationRowSection() {
  return (
    <>
      <Specimen title="Billete activo">
        <div className="ui-denomination-list">
          <DenominationRow value={1000} symbol="$" kind="bill">
            <Switch label="Activa" aria-label="Activar $ 1.000" defaultChecked />
          </DenominationRow>
          <DenominationRow value={0.5} symbol="$" kind="coin" inactive>
            <Switch label="Inactiva" aria-label="Activar $ 0,5" />
          </DenominationRow>
        </div>
      </Specimen>
    </>
  );
}
