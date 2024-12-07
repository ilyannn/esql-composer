import { GeoPointFormatter } from "./geoPointFormatter";

describe("GeoPointFormatter", () => {
  describe("parsePoint", () => {
    it("should parse a valid POINT string", () => {
      const pointStr = "POINT (30.123 -20.456)";
      const result = GeoPointFormatter.parsePoint(pointStr);
      expect(result).toEqual({ longitude: 30.123, latitude: -20.456 });
    });

    it("should throw an error for an invalid POINT string", () => {
      const pointStr = "INVALID (30.123 -20.456)";
      expect(() => GeoPointFormatter.parsePoint(pointStr)).toThrow(
        'Invalid POINT format. Expected: "POINT (longitude latitude)"'
      );
    });

    it("should throw an error for out of range latitude", () => {
      const pointStr = "POINT (30.123 -100.456)";
      expect(() => GeoPointFormatter.parsePoint(pointStr)).toThrow(
        "Latitude must be between -90 and 90 degrees"
      );
    });

    it("should throw an error for out of range longitude", () => {
      const pointStr = "POINT (200.123 -20.456)";
      expect(() => GeoPointFormatter.parsePoint(pointStr)).toThrow(
        "Longitude must be between -180 and 180 degrees"
      );
    });
  });

  describe("format", () => {
    it("should format a valid POINT string with default precision", () => {
      const pointStr = "POINT (30.123456 -20.654321)";
      const result = GeoPointFormatter.format(pointStr);
      expect(result).toBe("20.654°S, 30.123°E");
    });

    it("should format a valid POINT string with specified precision", () => {
      const pointStr = "POINT (30.123456 -20.654321)";
      const result = GeoPointFormatter.format(pointStr, 2);
      expect(result).toBe("20.65°S, 30.12°E");
    });

    it("should throw an error for an invalid POINT string", () => {
      const pointStr = "INVALID (30.123 -20.456)";
      expect(() => GeoPointFormatter.format(pointStr)).toThrow(
        'Invalid POINT format. Expected: "POINT (longitude latitude)"'
      );
    });
  });
});
