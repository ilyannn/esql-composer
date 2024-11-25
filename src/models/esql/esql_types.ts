export type ESQLNumberType =
  | "double"
  | "integer"
  | "long"
  | "unsigned_long"
  | "date"
  | "date_nanos"
  | "counter_integer"
  | "counter_long"
  | "counter_double";
export type ESQLStringType = "keyword" | "text" | "ip" | "version";
export type ESQLBooleanType = "boolean";
export type ESQLGeoType =
  | "geo_point"
  | "geo_shape"
  | "cartesian_point"
  | "cartesian_shape";
export type ESQLColumnType =
  | ESQLBooleanType
  | ESQLNumberType
  | ESQLStringType
  | ESQLGeoType;

export type ESQLColumnTypeClass = "boolean" | "number" | "string" | "geo";

export const esqlTypeToClass = (type: ESQLColumnType): ESQLColumnTypeClass => {
  switch (type) {
    case "boolean":
      return "boolean";

    case "double":
    case "integer":
    case "long":
    case "unsigned_long":
    case "date":
    case "date_nanos":
    case "counter_integer":
    case "counter_long":
    case "counter_double":
    case "version":
      return "number";

    case "keyword":
    case "text":
    case "ip":
      return "string";

    case "geo_point":
    case "geo_shape":
    case "cartesian_point":
    case "cartesian_shape":
      return "geo";
  }
};

export const esqlIsTypeSortable = (type: ESQLColumnType): boolean => {
  return esqlTypeToClass(type) !== "geo";
};
