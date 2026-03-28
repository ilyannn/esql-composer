import { getGeometryBounds, getGeometryPoints, parseWkt } from "./wkt";

describe("parseWkt", () => {
  it("parses polygons with holes", () => {
    const geometry = parseWkt(
      "POLYGON ((35 10, 45 45, 15 40, 10 20, 35 10), (20 30, 35 35, 30 20, 20 30))",
    );

    expect(geometry).toEqual({
      type: "POLYGON",
      rings: [
        [
          [35, 10],
          [45, 45],
          [15, 40],
          [10, 20],
          [35, 10],
        ],
        [
          [20, 30],
          [35, 35],
          [30, 20],
          [20, 30],
        ],
      ],
    });
  });

  it("parses geometry collections", () => {
    const geometry = parseWkt(
      "GEOMETRYCOLLECTION (POINT (40 10), LINESTRING (10 10, 20 20, 10 40))",
    );

    expect(geometry).toEqual({
      type: "GEOMETRYCOLLECTION",
      geometries: [
        {
          type: "POINT",
          point: [40, 10],
        },
        {
          type: "LINESTRING",
          points: [
            [10, 10],
            [20, 20],
            [10, 40],
          ],
        },
      ],
    });
  });

  it("computes geometry bounds", () => {
    const geometry = parseWkt(
      "MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))",
    );

    expect(getGeometryBounds(geometry)).toEqual({
      minX: 5,
      minY: 5,
      maxX: 45,
      maxY: 40,
    });
  });

  it("parses multipoint forms with and without nested parentheses", () => {
    expect(
      parseWkt("MULTIPOINT ((10 40), (40 30), (20 20), (30 10))"),
    ).toEqual({
      type: "MULTIPOINT",
      points: [
        [10, 40],
        [40, 30],
        [20, 20],
        [30, 10],
      ],
    });

    expect(parseWkt("MULTIPOINT (10 40, 40 30, 20 20, 30 10)")).toEqual({
      type: "MULTIPOINT",
      points: [
        [10, 40],
        [40, 30],
        [20, 20],
        [30, 10],
      ],
    });
  });

  it("parses multiline strings and extracts all points", () => {
    const geometry = parseWkt(
      "MULTILINESTRING ((10 10, 20 20, 10 40), (40 40, 30 30, 40 20, 30 10))",
    );

    expect(geometry).toEqual({
      type: "MULTILINESTRING",
      lines: [
        [
          [10, 10],
          [20, 20],
          [10, 40],
        ],
        [
          [40, 40],
          [30, 30],
          [40, 20],
          [30, 10],
        ],
      ],
    });

    expect(getGeometryPoints(geometry)).toEqual([
      [10, 10],
      [20, 20],
      [10, 40],
      [40, 40],
      [30, 30],
      [40, 20],
      [30, 10],
    ]);
  });

  it("handles empty geometries", () => {
    expect(parseWkt("POINT EMPTY")).toEqual({
      type: "POINT",
      point: null,
    });
    expect(parseWkt("LINESTRING EMPTY")).toEqual({
      type: "LINESTRING",
      points: [],
    });
    expect(parseWkt("POLYGON EMPTY")).toEqual({
      type: "POLYGON",
      rings: [],
    });
    expect(parseWkt("MULTIPOINT EMPTY")).toEqual({
      type: "MULTIPOINT",
      points: [],
    });
    expect(parseWkt("MULTILINESTRING EMPTY")).toEqual({
      type: "MULTILINESTRING",
      lines: [],
    });
    expect(parseWkt("MULTIPOLYGON EMPTY")).toEqual({
      type: "MULTIPOLYGON",
      polygons: [],
    });
    expect(parseWkt("GEOMETRYCOLLECTION EMPTY")).toEqual({
      type: "GEOMETRYCOLLECTION",
      geometries: [],
    });
    expect(getGeometryBounds(parseWkt("POINT EMPTY"))).toBeNull();
  });

  it("supports dimension suffixes on geometries", () => {
    expect(parseWkt("POINT Z (10 20 99)")).toEqual({
      type: "POINT",
      point: [10, 20],
    });
    expect(parseWkt("LINESTRING M (0 0, 1 1)")).toEqual({
      type: "LINESTRING",
      points: [
        [0, 0],
        [1, 1],
      ],
    });
  });

  it("rejects malformed geometries", () => {
    expect(() => parseWkt("NOT_A_GEOMETRY (10 20)")).toThrow(
      'Unsupported WKT geometry "NOT_A_GEOMETRY (10 20)"',
    );
    expect(() => parseWkt("POINT 10 20")).toThrow(
      'Unsupported WKT geometry "POINT 10 20"',
    );
    expect(() => parseWkt("POINT (hello world)")).toThrow(
      'Invalid WKT coordinate "hello world"',
    );
  });
});
