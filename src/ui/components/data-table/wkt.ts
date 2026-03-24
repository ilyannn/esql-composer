export type WKTPoint = [number, number];

export interface WKTBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type WKTGeometry =
  | { type: "POINT"; point: WKTPoint | null }
  | { type: "LINESTRING"; points: WKTPoint[] }
  | { type: "POLYGON"; rings: WKTPoint[][] }
  | { type: "MULTIPOINT"; points: WKTPoint[] }
  | { type: "MULTILINESTRING"; lines: WKTPoint[][] }
  | { type: "MULTIPOLYGON"; polygons: WKTPoint[][][] }
  | { type: "GEOMETRYCOLLECTION"; geometries: WKTGeometry[] };

const WKT_GEOMETRY_PATTERN =
  /^([A-Z]+)(?:\s+(?:ZM|Z|M))?\s*(EMPTY|\(.*\))$/is;

const stripOuterParentheses = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) {
    throw new Error(`Expected a parenthesized WKT group, got "${value}"`);
  }

  return trimmed.slice(1, -1).trim();
};

const splitTopLevel = (value: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of value) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    }

    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
};

const parseCoordinate = (value: string): WKTPoint => {
  const parts = value
    .trim()
    .split(/\s+/)
    .map((coordinate) => Number(coordinate));

  if (
    parts.length < 2 ||
    Number.isNaN(parts[0]) ||
    Number.isNaN(parts[1])
  ) {
    throw new Error(`Invalid WKT coordinate "${value}"`);
  }

  return [parts[0], parts[1]];
};

const parseCoordinateList = (value: string): WKTPoint[] =>
  splitTopLevel(value).map(parseCoordinate);

const parsePointText = (value: string): WKTPoint =>
  parseCoordinate(stripOuterParentheses(value));

const parsePolygonBody = (value: string): WKTPoint[][] =>
  splitTopLevel(value).map((ring) =>
    parseCoordinateList(stripOuterParentheses(ring)),
  );

export const parseWkt = (value: string): WKTGeometry => {
  const trimmedValue = value.trim();
  const match = trimmedValue.match(WKT_GEOMETRY_PATTERN);

  if (!match) {
    throw new Error(`Unsupported WKT geometry "${value}"`);
  }

  const geometryType = match[1].toUpperCase();
  const body = match[2];

  if (body.toUpperCase() === "EMPTY") {
    switch (geometryType) {
      case "POINT":
        return { type: "POINT", point: null };
      case "LINESTRING":
        return { type: "LINESTRING", points: [] };
      case "POLYGON":
        return { type: "POLYGON", rings: [] };
      case "MULTIPOINT":
        return { type: "MULTIPOINT", points: [] };
      case "MULTILINESTRING":
        return { type: "MULTILINESTRING", lines: [] };
      case "MULTIPOLYGON":
        return { type: "MULTIPOLYGON", polygons: [] };
      case "GEOMETRYCOLLECTION":
        return { type: "GEOMETRYCOLLECTION", geometries: [] };
    }
  }

  const content = stripOuterParentheses(body);

  switch (geometryType) {
    case "POINT":
      return { type: "POINT", point: parseCoordinate(content) };

    case "LINESTRING":
      return { type: "LINESTRING", points: parseCoordinateList(content) };

    case "POLYGON":
      return { type: "POLYGON", rings: parsePolygonBody(content) };

    case "MULTIPOINT": {
      const parts = splitTopLevel(content);
      const points = parts.every((part) => part.startsWith("("))
        ? parts.map(parsePointText)
        : parseCoordinateList(content);

      return { type: "MULTIPOINT", points };
    }

    case "MULTILINESTRING":
      return {
        type: "MULTILINESTRING",
        lines: splitTopLevel(content).map((line) =>
          parseCoordinateList(stripOuterParentheses(line)),
        ),
      };

    case "MULTIPOLYGON":
      return {
        type: "MULTIPOLYGON",
        polygons: splitTopLevel(content).map((polygon) =>
          parsePolygonBody(stripOuterParentheses(polygon)),
        ),
      };

    case "GEOMETRYCOLLECTION":
      return {
        type: "GEOMETRYCOLLECTION",
        geometries: splitTopLevel(content).map(parseWkt),
      };

    default:
      throw new Error(`Unsupported WKT geometry "${value}"`);
  }
};

export const getGeometryPoints = (geometry: WKTGeometry): WKTPoint[] => {
  switch (geometry.type) {
    case "POINT":
      return geometry.point ? [geometry.point] : [];

    case "LINESTRING":
      return geometry.points;

    case "POLYGON":
      return geometry.rings.flat();

    case "MULTIPOINT":
      return geometry.points;

    case "MULTILINESTRING":
      return geometry.lines.flat();

    case "MULTIPOLYGON":
      return geometry.polygons.flat(2);

    case "GEOMETRYCOLLECTION":
      return geometry.geometries.flatMap(getGeometryPoints);
  }
};

export const getGeometryBounds = (
  geometry: WKTGeometry,
): WKTBounds | null => {
  const points = getGeometryPoints(geometry);

  if (points.length === 0) {
    return null;
  }

  return points.reduce<WKTBounds>(
    (bounds, [x, y]) => ({
      minX: Math.min(bounds.minX, x),
      minY: Math.min(bounds.minY, y),
      maxX: Math.max(bounds.maxX, x),
      maxY: Math.max(bounds.maxY, y),
    }),
    {
      minX: points[0][0],
      minY: points[0][1],
      maxX: points[0][0],
      maxY: points[0][1],
    },
  );
};
