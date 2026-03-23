import {
  ESQLValueTrue,
  ESQLValueFalse,
  ESQLValueNull,
} from "./esql_types";
import {
  countRawValuesWithCount,
  getValueCount,
  statisticsEntries,
} from "./ValueStatistics";

describe("countRawValuesWithCount", () => {
  it("should count string values with counts", () => {
    const result = countRawValuesWithCount([
      ["a", 3],
      ["b", 2],
    ]);
    expect(result.totalCount).toBe(5);
    expect(result.stringCounts["a"]).toBe(3);
    expect(result.stringCounts["b"]).toBe(2);
  });

  it("should count number values with counts", () => {
    const result = countRawValuesWithCount([
      [10, 4],
      [20, 1],
    ]);
    expect(result.totalCount).toBe(5);
    expect(result.numberCounts[10]).toBe(4);
    expect(result.numberCounts[20]).toBe(1);
  });

  it("should count null, true, false with counts", () => {
    const result = countRawValuesWithCount([
      [null, 5],
      [true, 3],
      [false, 2],
    ]);
    expect(result.totalCount).toBe(10);
    expect(result.nullCount).toBe(5);
    expect(result.trueCount).toBe(3);
    expect(result.falseCount).toBe(2);
  });

  it("should accumulate counts for the same value", () => {
    const result = countRawValuesWithCount([
      ["a", 2],
      ["a", 3],
    ]);
    expect(result.stringCounts["a"]).toBe(5);
    expect(result.totalCount).toBe(5);
  });

  it("should handle empty input", () => {
    const result = countRawValuesWithCount([]);
    expect(result.totalCount).toBe(0);
    expect(result.nullCount).toBe(0);
  });
});

describe("getValueCount", () => {
  it("should return 0 for undefined stats", () => {
    expect(getValueCount("a", undefined)).toBe(0);
  });

  it("should return trueCount for ESQLValueTrue", () => {
    const stats = countRawValuesWithCount([[true, 7]]);
    expect(getValueCount(ESQLValueTrue, stats)).toBe(7);
  });

  it("should return falseCount for ESQLValueFalse", () => {
    const stats = countRawValuesWithCount([[false, 4]]);
    expect(getValueCount(ESQLValueFalse, stats)).toBe(4);
  });

  it("should return nullCount for ESQLValueNull", () => {
    const stats = countRawValuesWithCount([[null, 9]]);
    expect(getValueCount(ESQLValueNull, stats)).toBe(9);
  });

  it("should return string count", () => {
    const stats = countRawValuesWithCount([["hello", 3]]);
    expect(getValueCount("hello", stats)).toBe(3);
  });

  it("should return number count", () => {
    const stats = countRawValuesWithCount([[42, 6]]);
    expect(getValueCount(42, stats)).toBe(6);
  });

  it("should return 0 for missing string value", () => {
    const stats = countRawValuesWithCount([["a", 1]]);
    expect(getValueCount("missing", stats)).toBe(0);
  });

  it("should return 0 for missing number value", () => {
    const stats = countRawValuesWithCount([[1, 1]]);
    expect(getValueCount(999, stats)).toBe(0);
  });
});

describe("statisticsEntries with undefined", () => {
  it("should return empty array for undefined stats", () => {
    expect(statisticsEntries(undefined)).toEqual([]);
  });
});
