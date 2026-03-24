import { Box } from "@chakra-ui/react";
import React from "react";
import FieldValue from "./FieldValue";
import {
  getGeometryBounds,
  parseWkt,
  type WKTGeometry,
  type WKTPoint,
} from "./wkt";

interface WktRendererProps {
  wkt: string;
  height?: string;
  width?: string;
}

const SVG_SIZE = 100;
const SVG_PADDING = 6;
const DRAWABLE_SIZE = SVG_SIZE - 2 * SVG_PADDING;

export const WktRenderer: React.FC<WktRendererProps> = ({
  wkt,
  height = "100px",
  width = "100px",
}) => {
  let geometry: WKTGeometry;

  try {
    geometry = parseWkt(wkt);
  } catch (_error) {
    return <FieldValue value={wkt} />;
  }

  const bounds = getGeometryBounds(geometry);
  if (!bounds) {
    return <FieldValue value={wkt} />;
  }

  const projectPoint = ([x, y]: WKTPoint): WKTPoint => {
    const projectedX =
      bounds.maxX === bounds.minX
        ? SVG_SIZE / 2
        : SVG_PADDING +
          ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * DRAWABLE_SIZE;
    const projectedY =
      bounds.maxY === bounds.minY
        ? SVG_SIZE / 2
        : SVG_SIZE -
          SVG_PADDING -
          ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * DRAWABLE_SIZE;

    return [projectedX, projectedY];
  };

  const renderPoint = (point: WKTPoint, key: string) => {
    const [cx, cy] = projectPoint(point);
    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={3}
        fill="rgba(64, 64, 64, 0.5)"
        stroke="#0000f0"
        strokeWidth={2}
      />
    );
  };

  const renderLine = (points: WKTPoint[], key: string) => (
    <polyline
      key={key}
      fill="none"
      points={points
        .map(projectPoint)
        .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
        .join(" ")}
      stroke="#0000f0"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    />
  );

  const renderPolygon = (rings: WKTPoint[][], key: string) => {
    const path = rings
      .map((ring) =>
        ring
          .map(projectPoint)
          .map(([x, y], index) =>
            `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
          )
          .concat("Z")
          .join(" "),
      )
      .join(" ");

    return (
      <path
        key={key}
        d={path}
        fill="rgba(0, 0, 240, 0.15)"
        fillRule="evenodd"
        stroke="#0000f0"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    );
  };

  const renderGeometry = (
    currentGeometry: WKTGeometry,
    prefix = "geometry",
  ): React.ReactNode[] => {
    switch (currentGeometry.type) {
      case "POINT":
        return currentGeometry.point
          ? [renderPoint(currentGeometry.point, `${prefix}-point`)]
          : [];

      case "LINESTRING":
        return [renderLine(currentGeometry.points, `${prefix}-line`)];

      case "POLYGON":
        return [renderPolygon(currentGeometry.rings, `${prefix}-polygon`)];

      case "MULTIPOINT":
        return currentGeometry.points.map((point, index) =>
          renderPoint(point, `${prefix}-point-${index}`),
        );

      case "MULTILINESTRING":
        return currentGeometry.lines.map((line, index) =>
          renderLine(line, `${prefix}-line-${index}`),
        );

      case "MULTIPOLYGON":
        return currentGeometry.polygons.map((polygon, index) =>
          renderPolygon(polygon, `${prefix}-polygon-${index}`),
        );

      case "GEOMETRYCOLLECTION":
        return currentGeometry.geometries.flatMap((geometryItem, index) =>
          renderGeometry(geometryItem, `${prefix}-collection-${index}`),
        );
    }
  };

  return (
    <Box
      as="svg"
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      width={width}
      height={height}
      borderRadius="md"
      backgroundColor="white"
    >
      {renderGeometry(geometry)}
    </Box>
  );
};
