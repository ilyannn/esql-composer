import { ESQLTableData, isESQLTableData } from "./types";

describe("isESQLTableData", () => {
  it("should return true for valid ESQLTableData", () => {
    const validData: ESQLTableData = {
      columns: [
        { name: "column1", type: "text" },
        { name: "column2", type: "double" },
      ],
      values: [
        ["value1", 123],
        ["value2", 456],
      ],
    };

    expect(isESQLTableData(validData)).toBe(true);
  });

  it("should return false for data missing columns", () => {
    const invalidData = {
      values: [
        ["value1", 123],
        ["value2", 456],
      ],
    };

    expect(isESQLTableData(invalidData)).toBe(false);
  });

  it("should return false for data missing values", () => {
    const invalidData = {
      columns: [
        { name: "column1", type: "string" },
        { name: "column2", type: "number" },
      ],
    };

    expect(isESQLTableData(invalidData)).toBe(false);
  });

  it("should return false for data with invalid column structure", () => {
    const invalidData = {
      columns: [{ name: "column1", type: "string" }, { name: "column2" }],
      values: [
        ["value1", 123],
        ["value2", 456],
      ],
    };

    expect(isESQLTableData(invalidData)).toBe(false);
  });

  it("should not return false for data with invalid values structure", () => {
    const invalidData = {
      columns: [
        { name: "column1", type: "string" },
        { name: "column2", type: "number" },
      ],
      values: [
        ["value1", 123],
        ["value2", "invalid"],
      ],
    };

    expect(isESQLTableData(invalidData)).toBe(true);
  });

  it("should return false for data with invalid row structure", () => {
    const invalidData = {
      columns: [
        { name: "column1", type: "string" },
        { name: "column2", type: "number" },
      ],
      values: ["invalid", ["value2", 456]],
    };

    expect(isESQLTableData(invalidData)).toBe(false);
  });
});
