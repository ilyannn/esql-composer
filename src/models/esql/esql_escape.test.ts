import { escape } from "./esql_escape";

describe("escape", () => {
  it("should escape names with special characters", () => {
    expect(escape("name with space")).toBe("`name with space`");
    expect(escape("name-with-dash")).toBe("`name-with-dash`");
    expect(escape("name.with.dot")).toBe("name.with.dot");
    expect(escape("name`with`backtick")).toBe("`name``with``backtick`");
  });

  it("should not escape valid names", () => {
    expect(escape("validName")).toBe("validName");
    expect(escape("valid_name")).toBe("valid_name");
    expect(escape("_validName")).toBe("_validName");
    expect(escape("@validName")).toBe("@validName");
  });

  it("should escape names starting with invalid characters", () => {
    expect(escape("1invalidName")).toBe("`1invalidName`");
    expect(escape("-invalidName")).toBe("`-invalidName`");
    expect(escape(".invalidName")).toBe("`.invalidName`");
  });
});
