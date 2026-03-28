import { deepEqual } from "./equality";

describe("deepEqual", () => {
  it("matches nested plain objects", () => {
    expect(
      deepEqual(
        {
          selected: "anthropic",
          anthropic: {
            apiKey: "sk-test",
            models: ["haiku", "sonnet"],
          },
        },
        {
          selected: "anthropic",
          anthropic: {
            apiKey: "sk-test",
            models: ["haiku", "sonnet"],
          },
        },
      ),
    ).toBe(true);
  });

  it("detects nested value differences", () => {
    expect(
      deepEqual(
        {
          anthropic: {
            apiKey: "sk-test",
            models: ["haiku", "sonnet"],
          },
        },
        {
          anthropic: {
            apiKey: "sk-test",
            models: ["haiku", "opus"],
          },
        },
      ),
    ).toBe(false);
  });

  it("detects missing keys on plain objects", () => {
    expect(
      deepEqual(
        {
          anthropic: {
            apiKey: "sk-test",
          },
        },
        {
          anthropic: {
            apiKey: "sk-test",
            isKnownToWork: true,
          },
        },
      ),
    ).toBe(false);
  });

  it("handles arrays and primitive mismatches", () => {
    expect(deepEqual(["haiku", "sonnet"], ["haiku", "sonnet"])).toBe(true);
    expect(deepEqual(["haiku", "sonnet"], ["haiku"])).toBe(false);
    expect(deepEqual(["haiku"], { 0: "haiku" })).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual("haiku", "sonnet")).toBe(false);
  });
});
