import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pager } from "@/components/ui/pager";

describe("Pager", () => {
  it("shows the range and disables Anterior on the first page", () => {
    const html = renderToStaticMarkup(<Pager page={1} pageSize={6} total={6} onPageChange={() => {}} />);
    expect(html).toContain("Mostrando 1–6 de 6");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>.*Anterior/);
  });
  it("handles an empty list", () => {
    expect(renderToStaticMarkup(<Pager page={1} pageSize={6} total={0} onPageChange={() => {}} />)).toContain("Mostrando 0–0 de 0");
  });
});
