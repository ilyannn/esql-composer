import { ESQLColumn } from "./esql_types";
import { constructWhereClause } from "./clauses";

describe("createWhereClause", () => {
  const field: ESQLColumn = {
    name: "field",
    type: "keyword",
  };

  it("should include all values when defaultIncluded is true and no special values or nullIsSpecial", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: true,
      specialValues: [],
    });
    expect(result).toBe("true");
  });

  it("should exclude all values when defaultIncluded is false and no special values or nullIsSpecial", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: false,
      specialValues: [],
    });
    expect(result).toBe("false");
  });
  it("should return WHERE clause with IS NOT NULL when nullIsSpecial is true and defaultIncluded is true", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: true,
      specialValues: [],
      nullIsSpecial: true,
    });
    expect(result).toBe("field IS NOT NULL");
  });

  it("should return WHERE clause with IS NULL when nullIsSpecial is true and defaultIncluded is false", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: false,
      specialValues: [],
      nullIsSpecial: true,
    });
    expect(result).toBe("field IS NULL");
  });

  it("should return WHERE clause with != for special values when defaultIncluded is true", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: true,
      specialValues: [1, 2],
    });
    expect(result).toBe("field != 1 AND field != 2");
  });

  it("should return WHERE clause with == for special values when defaultIncluded is false", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: false,
      specialValues: [1, 2],
    });
    expect(result).toBe("field == 1 OR field == 2");
  });

  it("should return WHERE clause with NOT IN for special values when defaultIncluded is true and more than 2 special values", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: true,
      specialValues: [1, 2, 3],
    });
    expect(result).toBe("field NOT IN (1, 2, 3)");
  });

  it("should return WHERE clause with IN for special values when defaultIncluded is false and more than 2 special values", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: false,
      specialValues: [1, 2, 3],
    });
    expect(result).toBe("field IN (1, 2, 3)");
  });

  it("should combine clauses correctly with AND connector when defaultIncluded is true", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: true,
      specialValues: [1],
      nullIsSpecial: true,
    });
    expect(result).toBe("field IS NOT NULL AND field != 1");
  });

  it("should combine clauses correctly with OR connector when defaultIncluded is false", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: false,
      specialValues: [1],
      nullIsSpecial: true,
    });
    expect(result).toBe("field IS NULL OR field == 1");
  });

  it("should quote field values", () => {
    const result = constructWhereClause({
      field,
      defaultIncluded: false,
      specialValues: ["value with space", 'value with " inside'],
    });

    expect(result).toBe(
      'field == "value with space" OR field == """value with " inside"""'
    );
  });

  it("should not quote the geo fields", () => {
    const result = constructWhereClause({
      field: {
        name: "location",
        type: "geo_point",
      },
      defaultIncluded: false,
      specialValues: ["POINT(1, 2)"],
    });

    expect(result).toBe('ST_WITHIN(location, "POINT(1, 2)"::geo_point)');
  });
});
