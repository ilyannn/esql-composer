import { getDroppedSecretValue } from "./LLMConfigurationArea";

describe("getDroppedSecretValue", () => {
  it("should return empty string for empty input", () => {
    expect(getDroppedSecretValue("")).toBe("");
  });

  it("should return empty string for whitespace-only input", () => {
    expect(getDroppedSecretValue("   \n  ")).toBe("");
  });

  it("should return plain text as-is", () => {
    expect(getDroppedSecretValue("sk-ant-abc123")).toBe("sk-ant-abc123");
  });

  it("should trim plain text", () => {
    expect(getDroppedSecretValue("  sk-ant-abc123  \n")).toBe("sk-ant-abc123");
  });

  it("should extract a JSON string value", () => {
    expect(getDroppedSecretValue('"sk-ant-abc123"')).toBe("sk-ant-abc123");
  });

  it("should trim extracted JSON string", () => {
    expect(getDroppedSecretValue('"  sk-ant-abc123  "')).toBe("sk-ant-abc123");
  });

  it("should extract apiKey from JSON object", () => {
    const json = JSON.stringify({ apiKey: "sk-ant-abc123" });
    expect(getDroppedSecretValue(json)).toBe("sk-ant-abc123");
  });

  it("should extract key from JSON object", () => {
    const json = JSON.stringify({ key: "my-key-value" });
    expect(getDroppedSecretValue(json)).toBe("my-key-value");
  });

  it("should extract token from JSON object", () => {
    const json = JSON.stringify({ token: "my-token" });
    expect(getDroppedSecretValue(json)).toBe("my-token");
  });

  it("should extract encoded from JSON object", () => {
    const json = JSON.stringify({ encoded: "base64stuff" });
    expect(getDroppedSecretValue(json)).toBe("base64stuff");
  });

  it("should prefer apiKey over other keys", () => {
    const json = JSON.stringify({
      apiKey: "primary",
      key: "secondary",
      token: "tertiary",
    });
    expect(getDroppedSecretValue(json)).toBe("primary");
  });

  it("should return trimmed text for JSON object without known keys", () => {
    const json = JSON.stringify({ unknown: "value" });
    expect(getDroppedSecretValue(json)).toBe(json.trim());
  });

  it("should return trimmed text for JSON number", () => {
    expect(getDroppedSecretValue("42")).toBe("42");
  });

  it("should return trimmed text for invalid JSON", () => {
    expect(getDroppedSecretValue("{broken json")).toBe("{broken json");
  });
});
