import fixtures from "./fixtures/synthetic.json";
import { describe, expect, it } from "vitest";
import { parseText } from "./pipeline";

describe("synthetic fixtures", () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const result = parseText(fixture.input);
      const actual = result.items.map((item) => ({
        type: item.type,
        copyValue: item.copyValue
      }));

      expect(actual).toEqual(expect.arrayContaining(fixture.expected));
    });
  }
});
