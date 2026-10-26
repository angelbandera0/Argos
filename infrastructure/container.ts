import "server-only";
import { makeChangeOwnPassword } from "@/core/application/use-cases/access/change-own-password";
import { makeAuthGateway } from "@/infrastructure/supabase/auth-gateway";

export interface Container {
  changeOwnPassword: ReturnType<typeof makeChangeOwnPassword>;
}

let instance: Container | undefined;

export function getContainer(): Container {
  instance ??= {
    changeOwnPassword: makeChangeOwnPassword({ auth: makeAuthGateway() }),
  };
  return instance;
}

export function setContainerForTests(c: Partial<Container>): void {
  instance = { ...c } as Container;
}
