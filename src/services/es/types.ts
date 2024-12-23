import {
  ESQLColumn,
  ESQLAtomRawValue,
  ESQLAtomRawMultivalue,
} from "../../models/esql/esql_types";
import { CreateIndexParams } from "./indices";

export interface ESAPIOptions {
  apiURL: string;
  apiKey: string;
}

export interface ESQLQueryOptions extends ESAPIOptions {
  query: string;
}

export interface ESQLDeriveSchemaOptions extends ESAPIOptions {
  indexPattern: string;
  randomSamplingFactor?: number;
}

export class QueryAPIError extends Error {
  readonly status: number | undefined;
  readonly isAuthorizationError: boolean;

  constructor(status: number | undefined, error: any) {
    super(JSON.stringify(error, null, 2));

    this.status = status;
    this.isAuthorizationError = status === 401;
  }
}

export interface ESQLTableData {
  columns: ESQLColumn[];
  values: Array<Array<ESQLAtomRawValue | ESQLAtomRawMultivalue>>;
}

/**
 * Checks if the provided data conforms to the TableData interface.
 *
 * @param data - The data to check.
 * @returns A boolean indicating whether the data is of type TableData.
 *
 */
export function isESQLTableData(data: any): data is ESQLTableData {
  return (
    "columns" in data &&
    "values" in data &&
    Array.isArray(data.columns) &&
    data.columns.every(
      (col: any) => typeof col.name === "string" && typeof col.type === "string"
    ) &&
    Array.isArray(data.values) &&
    data.values.every(
      (row: any) =>
        Array.isArray(row) &&
        row.every(
          (val) =>
            typeof val === "string" ||
            typeof val === "number" ||
            typeof val === "boolean" ||
            (typeof val === "object" && Array.isArray(val)) ||
            val === null
        )
    )
  );
}

/**
 * Converts table data into an array of records.
 *
 * @param data - The table data to convert, which includes columns and values.
 * @returns An array of records where each record is an object with keys corresponding to column names and values corresponding to the row values.
 */
export const tableDataToRecords = (
  data: ESQLTableData
): Record<string, any>[] => {
  return data.values.map((row) =>
    row.reduce(
      (acc, val, idx) => ({
        ...acc,
        [data.columns[idx].name]: val,
      }),
      {}
    )
  );
};
