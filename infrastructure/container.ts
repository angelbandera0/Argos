import "server-only";
import { makeChangeOwnPassword } from "@/core/application/use-cases/access/change-own-password";
import { makeCreateAdmin } from "@/core/application/use-cases/access/create-admin";
import { type ApiServices, makeApiServices } from "@/infrastructure/supabase/api-services";
import { makeAuthGateway } from "@/infrastructure/supabase/auth-gateway";

export interface Container {
  changeOwnPassword: ReturnType<typeof makeChangeOwnPassword>;
  createAdmin: ReturnType<typeof makeCreateAdmin>;
  api: (token: string) => ApiServices;
}

let instance: Container | undefined;

export function getContainer(): Container {
  if (!instance) {
    const auth = makeAuthGateway();
    instance = {
      changeOwnPassword: makeChangeOwnPassword({ auth }),
      createAdmin: makeCreateAdmin({ auth }),
      api: makeApiServices,
    };
  }
  return instance;
}

export function setContainerForTests(c: Partial<Container>): void {
  instance = { ...c } as Container;
}
