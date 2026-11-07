export type ViewStateKind = "loading" | "empty" | "no-match" | "error" | "forbidden";

export function viewStateCopy(kind: ViewStateKind, entity: string, permission?: string) {
  const e = entity.toLowerCase();
  switch (kind) {
    case "loading":
      return { title: `Cargando ${e}`, text: "" };
    case "empty":
      return { title: `Aún no hay ${e}`, text: "Registra los primeros para empezar." };
    case "no-match":
      return { title: `Ningún resultado coincide`, text: "Prueba con otro nombre o quita algún filtro." };
    case "error":
      return { title: `No pudimos cargar ${e}`, text: "Revisa la conexión e inténtalo de nuevo. Tus cambios no se han perdido." };
    case "forbidden":
      return {
        title: `No tienes acceso a ${entity}`,
        text: `Pide a un administrador que añada el permiso «${permission ?? entity + " · Ver"}» a tu rol.`,
      };
  }
}

export const supportLine = (code: string, time?: string) => `Código para soporte: ${code}${time ? ` · ${time}` : ""}`;
