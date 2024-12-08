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

const quoteString = (value: string): string => {
  if (!value.includes('"')) {
    return '"' + value + '"';
  }

  if (value.includes('"') && !value.includes('"""')) {
    return '"""' + value + '"""';
  }

  return '"' + value.replace(/"/g, '\\"') + '"';
};

// Representation of the value that can be parsed back.
export const esqlRepresentation = (
  value: ESQLAtomValue,
  type: ESQLColumnType | undefined = undefined
): string => {
  const quoted =
    value === ESQLValueTrue
      ? "true"
      : value === ESQLValueFalse
      ? "false"
      : value === ESQLValueNull
      ? "null"
      : typeof value === "number"
      ? value.toString()
      : typeof value === "string"
      ? quoteString(value)
      : JSON.stringify(value);

  const needsConversion = type !== undefined && esqlTypeToClass(type) === "geo";
  return needsConversion ? quoted + "::" + type : quoted;
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

export type ESQLColumnTypeClass = "boolean" | "numeric" | "stringy" | "geo";

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
      return "numeric";

    case "keyword":
    case "text":
    case "ip":
      return "stringy";

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

export const flattenMultivalues = (
  data: (ESQLAtomRawValue | ESQLAtomRawMultivalue)[]
) => {
  return data.flatMap((d) => (Array.isArray(d) ? d : [d]));
};

/**
 * Represents our knowledge about the column of the ESQL table.
 */
export interface ESQLColumn {
  name: string;
  type: ESQLColumnType;
}
