import { makeRegisterEntry } from "./register-entry";
import type { StockOpsDeps } from "./operations-shared";

export const makeRegisterInitialEntry = (deps: StockOpsDeps) => makeRegisterEntry(deps, "initial");
