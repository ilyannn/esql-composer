export interface GeoPoint {
  longitude: number;
  latitude: number;
}

export class GeoPointFormatter {
  /**
   * Parses a POINT string into longitude and latitude
   * @param pointStr - String in format "POINT (longitude latitude)"
   */
  static parsePoint(pointStr: string): GeoPoint {
    const matches = pointStr.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!matches) {
      throw new Error(
        'Invalid POINT format. Expected: "POINT (longitude latitude)"'
      );
    }

    const [, longitude, latitude] = matches;
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    GeoPointFormatter.validateCoordinates(lon, lat);

    return { longitude: lon, latitude: lat };
  }

  /**
   * Validates coordinate ranges
   */
  private static validateCoordinates(
    longitude: number,
    latitude: number
  ): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error("Latitude must be between -90 and 90 degrees");
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error("Longitude must be between -180 and 180 degrees");
    }
  }

  /**
   * Formats a geographic point into a human-readable string
   * @param pointStr - String in format "POINT (longitude latitude)"
   * @param precision - Number of decimal places (default: 3)
   */
  static format(pointStr: string, precision = 3): string {
    const { longitude, latitude } = this.parsePoint(pointStr);

    const latDir = latitude >= 0 ? "N" : "S";
    const lonDir = longitude >= 0 ? "E" : "W";

    return `${Math.abs(latitude).toFixed(precision)}°${latDir}, ${Math.abs(
      longitude
    ).toFixed(precision)}°${lonDir}`;
  }
}
