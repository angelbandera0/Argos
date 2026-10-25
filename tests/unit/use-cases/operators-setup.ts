import { makeAssignStores } from "@/core/application/use-cases/users/assign-stores";
import { makeChangeOperatorRole } from "@/core/application/use-cases/users/change-operator-role";
import { makeCreateOperator } from "@/core/application/use-cases/users/create-operator";
import { makeDeactivateUser } from "@/core/application/use-cases/users/deactivate-user";
import { makeResetPin } from "@/core/application/use-cases/users/reset-pin";
import { makeUnlockUser } from "@/core/application/use-cases/users/unlock-user";
import type { Actor } from "@/core/domain/actor";
import type { PermissionSet } from "@/core/domain/permissions";
import { FakeAuthGateway } from "../../fakes/fake-auth-gateway";
import { InMemoryOrganization } from "../../fakes/in-memory-organization";
import { InMemoryRoles } from "../../fakes/in-memory-roles";
import { InMemoryUserRepository } from "../../fakes/in-memory-user-repository";

export const act = (userId: string, kind: Actor["kind"]): Actor => ({ userId, kind, channel: "ui" });
export const adminA = act("a1", "admin"); // founder of c1, owns rA and rEx
export const adminB = act("a3", "admin"); // has access to c1, owns rB
export const outsider = act("a2", "admin"); // only c2
export const superadmin = act("sa", "superadmin");
export const operator = act("op", "operator");

const view: PermissionSet = { view: true, create: false, edit: false, delete: false };

export async function setup() {
  const org = new InMemoryOrganization();
  org.seedCompany("c1", "a1", ["a3"]);
  org.seedCompany("c2", "a2");
  org.seedSite("s1", "c1");
  org.seedSite("s2", "c2");
  org.seedStore("t1", "c1", "s1");
  org.seedStore("t2", "c1", "s1");
  org.seedStore("t3", "c2", "s2");
  const roles = new InMemoryRoles();
  await roles.create({ ownerId: "a1", name: "A", sessionSeconds: null, excludedCompanyIds: [], permissions: { products: view } }); // r1
  await roles.create({ ownerId: "a3", name: "B", sessionSeconds: null, excludedCompanyIds: [], permissions: { products: view } }); // r2
  await roles.create({ ownerId: "a1", name: "Ex", sessionSeconds: null, excludedCompanyIds: ["c1"], permissions: { products: view } }); // r3
  await roles.create({ ownerId: "a1", name: "A2", sessionSeconds: null, excludedCompanyIds: [], permissions: { products: view } }); // r4
  const users = new InMemoryUserRepository();
  const auth = new FakeAuthGateway(users);
  const target = (id: string, companyId: string | null, status: "active" | "locked" | "deactivated" = "active", kind: Actor["kind"] = "operator") =>
    users.profiles.set(id, { id, kind, username: `abcd.${id}`, displayName: id, companyId, status, mustChangePassword: false });
  target("u1", "c1"); // operator with role r1 (admin A) in t1
  target("u2", "c2"); // operator of another company
  target("u3", "c1", "locked");
  target("adm", "c1", "active", "admin");
  target("orphan", null);
  users.assignments.set("u1", [{ userId: "u1", storeId: "t1", roleId: "r1" }]);
  const deps = { users, auth, companies: org.companyRepo, stores: org.storeRepo, roles };
  return {
    users,
    auth,
    create: makeCreateOperator(deps),
    assign: makeAssignStores(deps),
    changeRole: makeChangeOperatorRole(deps),
    resetPin: makeResetPin(deps),
    unlock: makeUnlockUser(deps),
    deactivate: makeDeactivateUser(deps),
  };
}
