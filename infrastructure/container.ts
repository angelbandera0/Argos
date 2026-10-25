import "server-only";

// Later tasks add ports and use cases here.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Container {}

let instance: Container | undefined;

export function getContainer(): Container {
  instance ??= {};
  return instance;
}

export function setContainerForTests(c: Partial<Container>): void {
  instance = { ...c } as Container;
}
