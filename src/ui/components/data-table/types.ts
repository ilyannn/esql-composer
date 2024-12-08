import {
  ESQLAtomRawMultivalue,
  ESQLAtomRawValue,
  ESQLColumn,
} from "../../../models/esql/esql_types";
import { Presenter } from "./presenters";

export interface TableColumn extends ESQLColumn {
  presenter: Presenter;
}

export type TableRow = (ESQLAtomRawValue | ESQLAtomRawMultivalue)[];

export interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
  row_keys: string[];
}

export const isTableDataEqual = (lhs: TableData, rhs: TableData) => {
  return (
    lhs.columns.length === rhs.columns.length &&
    lhs.columns.every((v, i) => v.name === rhs.columns[i].name) &&
    lhs.columns.every((v, i) => v.type === rhs.columns[i].type) &&
    lhs.rows.length === rhs.rows.length &&
    lhs.rows.every((v, i) => v.every((v2, j) => v2 === rhs.rows[i][j]))
  );
};
