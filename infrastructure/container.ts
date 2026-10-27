import "server-only";
import { makeChangeOwnPassword } from "@/core/application/use-cases/access/change-own-password";
import { makeCreateAdmin } from "@/core/application/use-cases/access/create-admin";
import { makeAuthGateway } from "@/infrastructure/supabase/auth-gateway";

export interface Container {
  changeOwnPassword: ReturnType<typeof makeChangeOwnPassword>;
  createAdmin: ReturnType<typeof makeCreateAdmin>;
}

let instance: Container | undefined;

export function getContainer(): Container {
  if (!instance) {
    const auth = makeAuthGateway();
    instance = {
      changeOwnPassword: makeChangeOwnPassword({ auth }),
      createAdmin: makeCreateAdmin({ auth }),
    };
  }
  return instance;
}

export function setContainerForTests(c: Partial<Container>): void {
  instance = { ...c } as Container;
}
