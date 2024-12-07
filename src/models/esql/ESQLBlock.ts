import { escape } from "./esql_escape";
import {
  ESQLAtomValue,
  ESQLColumnTypeClass,
  ESQLSentinelOtherValues,
  ESQLValueNull,
} from "./esql_types";
import { ValueStatistics } from "./ValueStatistics";
import { constructWhereClause } from "./clauses";
import { TableColumn } from "../../ui/components/data-table/types";

interface BaseESQLBlock {
  command: string;
  stableId?: string;
}

export interface BlockHasStableId {
  stableId: string;
}

export interface LimitBlock extends BaseESQLBlock {
  command: "LIMIT";
  limit: number | null;
}

export interface KeepBlock extends BaseESQLBlock {
  command: "KEEP";
  fields: string[];
}

export interface DropBlock extends BaseESQLBlock {
  command: "DROP";
  fields: string[];
}

export interface RenameBlock extends BaseESQLBlock {
  command: "RENAME";
  map: { [oldName: string]: string };
}

export interface FilterValue {
  value: ESQLAtomValue | typeof ESQLSentinelOtherValues;
  included: boolean;
}

export interface FilterBlock extends BaseESQLBlock {
  command: "WHERE";
  field: TableColumn;
  values: FilterValue[];
  localStats: ValueStatistics;
  topStatsRetrieved: number;
  topStats: ValueStatistics | undefined;
}
export interface EvalExpression {
  field: string;
  expression: string;
}

export interface EvalBlock extends BaseESQLBlock {
  command: "EVAL";
  expressions: EvalExpression[];
}
export interface OrderItem {
  field: string;
  sort_class: ESQLColumnTypeClass;
  asc: boolean;
}

export interface SortBlock extends BaseESQLBlock {
  command: "SORT";
  order: OrderItem[];
}

export type ESQLBlock =
  | EvalBlock
  | LimitBlock
  | KeepBlock
  | DropBlock
  | RenameBlock
  | FilterBlock
  | SortBlock;

/**
 * Applies a function to a specified field with optional arguments and returns the resulting string.
 *
 * The field names are escaped.
 *
 * @param func - The name of the function to apply.
 * @param field - The field to which the function will be applied.
 * @param args - Additional arguments to pass to the function.
 * @returns The resulting string after applying the function to the field with the provided arguments.
 */
export const applyFunctionToField = (
  func: string,
  field: string,
  ...args: any[]
): string => {
  return `${func}(${escape(field)}, ${args
    .map((arg) => JSON.stringify(arg))
    .join(", ")})`;
};

/**
 * Converts a LimitBlock into a ES|QL LIMIT clause string.
 *
 * @param block - The LimitBlock to convert.
 * @returns The ES|QL LIMIT clause string or null.
 */
const limitBlockToESQL = (block: LimitBlock): string | null => {
  if (block.limit === null) {
    return null;
  }
  return `LIMIT ${block.limit}`;
};

/**
 * Converts a `KeepBlock` object to its ES|QL representation.
 *
 * @param block - The `KeepBlock` object to convert.
 * @returns The ES|QL representation of the `KeepBlock` object, or `null` if the block has no fields.
 */
const keepBlockToESQL = (block: KeepBlock): string | null => {
  if (block.fields.length === 0) {
    return null;
  }
  return `KEEP ${block.fields.map(escape).join(", ")}`;
};

/**
 * Converts a `DropBlock` object to its ES|QL representation.
 *
 * @param block - The `DropBlock` object to convert.
 * @returns The ES|QL representation of the `DropBlock` object, or `null` if the block has no fields.
 */
const dropBlockToESQL = (block: DropBlock): string | null => {
  if (block.fields.length === 0) {
    return null;
  }
  return `DROP ${block.fields.map(escape).join(", ")}`;
};

/**
 * Converts a `RenameBlock` object to its ES|QL representation.
 *
 * @param block - The `RenameBlock` object to convert.
 * @returns The ES|QL representation of the `RenameBlock` object, or `null` if the block has no fields.
 */
const renameBlockToESQL = (block: RenameBlock): string | null => {
  if (Object.keys(block.map).length === 0) {
    return null;
  }
  const fields = Object.entries(block.map)
    .map(([oldName, newName]) => `${escape(oldName)} AS ${escape(newName)}`)
    .join(", ");
  return `RENAME ${fields}`;
};

/**
 * Converts a FilterBlock into a SQL WHERE clause string.
 *
 * @param block - The FilterBlock to convert.
 * @returns The SQL WHERE clause string or null.
 *
 * The result can be one of the following:
 * - `null` if the block does not do anything.
 * - `WHERE false` if all values are filtered out.
 * - `WHERE field == value` or `WHERE field != value` if there is one key value.
 * - `WHERE field IN (value1, value2, ...)` or `WHERE field NOT IN (value1, value2, ...)` if there are at least three key values.
 */
const whereBlockToESQL = (block: FilterBlock): string | null => {
  if (block.values.length === 0) {
    return null;
  }

  const defaultIncluded = block.values.some(
    (v) => v.value === ESQLSentinelOtherValues && v.included
  );

  const nullIsSpecial = block.values.some(
    (v) => v.value === ESQLValueNull && v.included !== defaultIncluded
  );

  const specialValues: ESQLAtomValue[] = block.values
    .filter((v) => v.included !== defaultIncluded)
    .map((v) => v.value)
    .filter((v) => v !== ESQLSentinelOtherValues && v !== ESQLValueNull);
  // Logically ESQLSentinelOtherValues will not be there, but makes the type checker happy

  const constructed = constructWhereClause({
    field: block.field,
    defaultIncluded,
    specialValues,
    nullIsSpecial,
  });

  if (constructed === "true") {
    return null;
  }

  return `WHERE ${constructed}`;
};

/**
 * Converts a SortBlock into an ES|QL SORT command.
 *
 * @param block - The SortBlock to convert.
 * @returns The ES|QL representation of the block or null if the block has no effect.
 */
const sortBlockToESQL = (block: SortBlock): string | null => {
  if (block.order.length === 0) {
    return null;
  }
  const fields = block.order
    .map((field) => `${escape(field.field)}${field.asc ? "" : " DESC"}`)
    .join(", ");
  return `SORT ${fields}`;
};

/**
 * Converts an EvalBlock into an ES|QL EVAL command.
 *
 * @param block - The EvalBlock to convert.
 * @returns The ES|QL representation of the block or null if the block has no effect.
 */
const evalBlockToESQL = (block: EvalBlock): string | null => {
  const expressions = block.expressions.filter((e) => e.expression !== "");

  if (expressions.length === 0) {
    return null;
  }

  return (
    "EVAL " +
    expressions
      .map(({ field, expression }) => `${escape(field)} = ${expression}`)
      .join(", ")
  );
};

/**
 * Converts an ESQLBlock into an ES|QL command.
 *
 * @param block - The ESQLBlock to convert.
 * @returns The ES|QL representation of the block or null if the block has no effect.
 */
export const esqlBlockToESQL = (block: ESQLBlock): string | null => {
  switch (block.command) {
    case "EVAL":
      return evalBlockToESQL(block);
    case "LIMIT":
      return limitBlockToESQL(block);
    case "KEEP":
      return keepBlockToESQL(block);
    case "DROP":
      return dropBlockToESQL(block);
    case "RENAME":
      return renameBlockToESQL(block);
    case "WHERE":
      return whereBlockToESQL(block);
    case "SORT":
      return sortBlockToESQL(block);
  }
};
