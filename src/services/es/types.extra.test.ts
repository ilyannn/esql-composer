import { QueryAPIError, tableDataToRecords, ESQLTableData } from "./types";

describe("QueryAPIError", () => {
  it("should store status and stringify error", () => {
    const err = new QueryAPIError(500, { message: "Internal Server Error" });
    expect(err.status).toBe(500);
    expect(err.isAuthorizationError).toBe(false);
    expect(err.message).toContain("Internal Server Error");
  });

  it("should mark 401 as authorization error", () => {
    const err = new QueryAPIError(401, { message: "Unauthorized" });
    expect(err.isAuthorizationError).toBe(true);
  });

  it("should handle undefined status", () => {
    const err = new QueryAPIError(undefined, "network failure");
    expect(err.status).toBeUndefined();
    expect(err.isAuthorizationError).toBe(false);
  });
});

describe("tableDataToRecords", () => {
  it("should convert table data to records", () => {
    const data: ESQLTableData = {
      columns: [
        { name: "name", type: "text" },
        { name: "age", type: "integer" },
      ],
      values: [
        ["Alice", 30],
        ["Bob", 25],
      ],
    };

    const records = tableDataToRecords(data);
    expect(records).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
  });

  it("should handle empty values", () => {
    const data: ESQLTableData = {
      columns: [{ name: "id", type: "integer" }],
      values: [],
    };

    expect(tableDataToRecords(data)).toEqual([]);
  });

  it("should handle null values in rows", () => {
    const data: ESQLTableData = {
      columns: [
        { name: "x", type: "text" },
        { name: "y", type: "integer" },
      ],
      values: [[null, 1]],
    };

    const records = tableDataToRecords(data);
    expect(records).toEqual([{ x: null, y: 1 }]);
  });
});
