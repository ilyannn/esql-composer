export type ESQLNonNullRawValue = string | number | boolean;
export type ESQLAtomRawValue = ESQLNonNullRawValue | null;
export type ESQLAtomRawMultivalue = ESQLAtomRawValue[];

export const ESQLValueTrue = Symbol("ES|QL true value");
export const ESQLValueFalse = Symbol("ES|QL false value");
export const ESQLValueNull = Symbol("ES|QL null value");
export const ESQLSentinelOtherValues = Symbol(
  "Represents values not listed otherwise"
);

export type ESQLAtomValue =
  | string
  | number
  | typeof ESQLValueTrue
  | typeof ESQLValueFalse
  | typeof ESQLValueNull;

export const esqlRawToHashableValue = (
  value: ESQLAtomRawValue
): ESQLAtomValue => {
  if (value === true) {
    return ESQLValueTrue;
  }
  if (value === false) {
    return ESQLValueFalse;
  }
  if (value === null) {
    return ESQLValueNull;
  }
  return value;
};

// Representation of the value that can be parsed back.
export const esqlRepresentation = (value: ESQLAtomValue): string => {
  if (value === ESQLValueTrue) {
    return "true";
  }
  if (value === ESQLValueFalse) {
    return "false";
  }
  if (value === ESQLValueNull) {
    return "null";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return JSON.stringify(value);
};

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
