import { getGeometryBounds, parseWkt } from "./wkt";

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
});
