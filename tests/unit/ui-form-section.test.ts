import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FormSection } from "@/components/ui/form-section";

describe("FormSection", () => {
  it("labels the section with its title and shows the number", () => {
    const html = renderToStaticMarkup(FormSection({ n: 2, title: "Compañías", children: null }));
    expect(html).toContain('aria-labelledby="fs-2-title"');
    expect(html).toContain(">2<");
  });
});
