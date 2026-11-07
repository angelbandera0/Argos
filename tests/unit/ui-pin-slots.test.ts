import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { PinSlots } from "@/components/ui/pin-slots";

const html = (p: Parameters<typeof PinSlots>[0]) => renderToStaticMarkup(createElement(PinSlots, p));

describe("PinSlots", () => {
  it("renders six slots", () => expect(html({}).match(/ui-pin-slot"/g)).toHaveLength(6));
  it("shows digits or masks them", () => {
    expect(html({ value: "123456" })).toContain(">3<");
    expect(html({ value: "123456", hidden: true })).not.toContain(">3<");
  });
});
