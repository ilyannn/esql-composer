import { representESQLField, representESQLValue } from "./esql_repr";
import { ESQLValueTrue, ESQLValueFalse, ESQLValueNull } from "./esql_types";

describe("representESQLField", () => {
  it("should escape names with special characters", () => {
    expect(representESQLField("name with space")).toBe("`name with space`");
    expect(representESQLField("name-with-dash")).toBe("`name-with-dash`");
    expect(representESQLField("name.with.dot")).toBe("name.with.dot");
    expect(representESQLField("name`with`backtick")).toBe(
      "`name``with``backtick`",
    );
  });

  it("should not escape valid names", () => {
    expect(representESQLField("validName")).toBe("validName");
    expect(representESQLField("valid_name")).toBe("valid_name");
    expect(representESQLField("_validName")).toBe("_validName");
    expect(representESQLField("@validName")).toBe("@validName");
  });

  it("should escape names starting with invalid characters", () => {
    expect(representESQLField("1invalidName")).toBe("`1invalidName`");
    expect(representESQLField("-invalidName")).toBe("`-invalidName`");
    expect(representESQLField(".invalidName")).toBe("`.invalidName`");
  });
});

describe("representESQLValue", () => {
  it('should return "true" for ESQLValueTrue', () => {
    expect(representESQLValue(ESQLValueTrue)).toBe("true");
  });

  it('should return "false" for ESQLValueFalse', () => {
    expect(representESQLValue(ESQLValueFalse)).toBe("false");
  });

  it('should return "null" for ESQLValueNull', () => {
    expect(representESQLValue(ESQLValueNull)).toBe("null");
  });

  it("should return string representation for number", () => {
    expect(representESQLValue(123)).toBe("123");
  });

  it("should return string representation for float", () => {
    expect(representESQLValue(123.45)).toBe("123.45");
  });

  it("should return JSON string for string", () => {
    expect(representESQLValue("test")).toBe('"test"');
  });

  it("should use triple quotes for string with double quotes", () => {
    expect(representESQLValue('test "test"')).toBe('"""test "test""""');
  });

  it("should escape double quotes in string when triple quotes don't work", () => {
    expect(representESQLValue('test """ test')).toBe('"test \\"\\"\\" test"');
  });

  it("should add conversion for geo types", () => {
    expect(representESQLValue("POINT(1 2)", "geo_point")).toBe(
      '"POINT(1 2)"::geo_point',
    );
  });
});
