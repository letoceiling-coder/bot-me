import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectLeadIntent } from "./lead-intent.util";

describe("detectLeadIntent", () => {
  it("detects phone number", () => {
    const result = detectLeadIntent("Позвоните +7 999 123-45-67");
    assert.equal(result.hasIntent, true);
    assert.ok(result.phone?.includes("7999"));
  });

  it("detects buy intent keywords", () => {
    const result = detectLeadIntent("Сколько стоит доставка?");
    assert.equal(result.hasIntent, true);
  });

  it("ignores casual messages", () => {
    const result = detectLeadIntent("Привет");
    assert.equal(result.hasIntent, false);
  });
});
