import { makeRegisterEntry } from "./register-entry";
import type { StockOpsDeps } from "./operations-shared";

export const makeRegisterDirectEntry = (deps: StockOpsDeps) => makeRegisterEntry(deps, "direct");
