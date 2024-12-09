import {
  esqlRawToHashableValue,
  ESQLValueTrue,
  ESQLValueFalse,
  ESQLValueNull,
  esqlTypeToClass,
  esqlIsTypeSortable,
} from "./esql_types";

describe("esqlRawToHashableValue", () => {
  it("should return ESQLValueTrue for true", () => {
    expect(esqlRawToHashableValue(true)).toBe(ESQLValueTrue);
  });

  it("should return ESQLValueFalse for false", () => {
    expect(esqlRawToHashableValue(false)).toBe(ESQLValueFalse);
  });

  it("should return ESQLValueNull for null", () => {
    expect(esqlRawToHashableValue(null)).toBe(ESQLValueNull);
  });

  it("should return the same value for string", () => {
    expect(esqlRawToHashableValue("test")).toBe("test");
  });

  it("should return the same value for number", () => {
    expect(esqlRawToHashableValue(123)).toBe(123);
  });

  it("should return the same value for float", () => {
    expect(esqlRawToHashableValue(123.45)).toBe(123.45);
  });

  it("should return the same value for float", () => {
    expect(esqlRawToHashableValue(704.4637451171875)).toBe(704.4637451171875);
  });
});

describe("esqlIsTypeSortable", () => {
  it("should return false for geo types", () => {
    expect(esqlIsTypeSortable("geo_point")).toBe(false);
    expect(esqlIsTypeSortable("geo_shape")).toBe(false);
    expect(esqlIsTypeSortable("cartesian_point")).toBe(false);
    expect(esqlIsTypeSortable("cartesian_shape")).toBe(false);
  });

  it("should return true for non-geo types", () => {
    expect(esqlIsTypeSortable("boolean")).toBe(true);
    expect(esqlIsTypeSortable("double")).toBe(true);
    expect(esqlIsTypeSortable("integer")).toBe(true);
    expect(esqlIsTypeSortable("long")).toBe(true);
    expect(esqlIsTypeSortable("unsigned_long")).toBe(true);
    expect(esqlIsTypeSortable("date")).toBe(true);
    expect(esqlIsTypeSortable("date_nanos")).toBe(true);
    expect(esqlIsTypeSortable("counter_integer")).toBe(true);
    expect(esqlIsTypeSortable("counter_long")).toBe(true);
    expect(esqlIsTypeSortable("counter_double")).toBe(true);
    expect(esqlIsTypeSortable("version")).toBe(true);
    expect(esqlIsTypeSortable("keyword")).toBe(true);
    expect(esqlIsTypeSortable("text")).toBe(true);
    expect(esqlIsTypeSortable("ip")).toBe(true);
  });
});
