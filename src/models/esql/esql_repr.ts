import {
  ESQLAtomValue,
  ESQLColumnType,
  ESQLValueTrue,
  ESQLValueFalse,
  ESQLValueNull,
  esqlTypeToClass,
} from "./esql_types";

const BACKTICK = "`";

// Identifiers are described in https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-syntax.html
// But we actually need the qualifiedName from the AST grammar which is a series of identifiers
// connected by dots. So we don't need to escape the dots either.
export const representESQLField = (name: string): string => {
  if (!/^[a-zA-Z_@]/.test(name) || /[^a-zA-Z0-9_.]/.test(name.slice(1))) {
    return `${BACKTICK}${name.replace(
      new RegExp(BACKTICK, "g"),
      BACKTICK + BACKTICK
    )}${BACKTICK}`;
  }
  return name;
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
export const representESQLValue = (
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

