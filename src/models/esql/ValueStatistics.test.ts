import { ESQLValueTrue, ESQLValueFalse, ESQLValueNull } from "./esql_types";
import { countRawValues, statisticsEntries } from "./ValueStatistics";

describe("countValues", () => {
  it("should count null values correctly", () => {
    const values = [null, null, null];
    const result = countRawValues(values);
    expect(result.nullCount).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  it("should count true values correctly", () => {
    const values = [true, true, true];
    const result = countRawValues(values);
    expect(result.trueCount).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  it("should count false values correctly", () => {
    const values = [false, false, false];
    const result = countRawValues(values);
    expect(result.falseCount).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  it("should count mixed values correctly", () => {
    const values = [true, false, null, true, false, null];
    const result = countRawValues(values);
    expect(result.trueCount).toBe(2);
    expect(result.falseCount).toBe(2);
    expect(result.nullCount).toBe(2);
    expect(result.totalCount).toBe(6);
  });

  it("should count string values correctly", () => {
    const values = ["a", "b", "a"];
    const result = countRawValues(values);
    expect(result.stringCounts["a"]).toBe(2);
    expect(result.stringCounts["b"]).toBe(1);
    expect(result.totalCount).toBe(3);
  });

  it("should count number values correctly", () => {
    const values = [1, 2, 1];
    const result = countRawValues(values);
    expect(result.numberCounts[1]).toBe(2);
    expect(result.numberCounts[2]).toBe(1);
    expect(result.totalCount).toBe(3);
  });
});

describe("statisticsItems", () => {
  it("should return correct items for mixed values", () => {
    const stats = countRawValues([true, false, null, "a", 1, "a", 1, 1]);
    const items = statisticsEntries(stats);
    expect(items).toContainEqual([ESQLValueTrue, 1]);
    expect(items).toContainEqual([ESQLValueFalse, 1]);
    expect(items).toContainEqual([ESQLValueNull, 1]);
    expect(items).toContainEqual(["a", 2]);
    expect(items).toContainEqual([1, 3]);
  });

  it("should return correct items for empty stats", () => {
    const stats = countRawValues([]);
    const items = statisticsEntries(stats);
    expect(items).toEqual([]);
  });
});
