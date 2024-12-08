import { Box, Wrap, VStack, Divider } from "@chakra-ui/react";
import React from "react";
import {
  ESQLAtomRawMultivalue,
  ESQLAtomRawValue,
  ESQLColumn,
  esqlRawToHashableValue,
} from "../../models/esql/esql_types";
import FieldTag from "./atoms/FieldTag";
import {
  TableColumn,
  TableData,
  TableRow,
  isTableDataEqual,
} from "./data-table/types";

interface DataTableCombinedColumnCellProps {
  columns: TableColumn[];
  row: TableRow;
}

const DataTableCombinedColumnCell = React.memo(
  ({ columns, row }: DataTableCombinedColumnCellProps) => {
    return (
      <Wrap justify={"flex-start"}>
        {row.map((val, colIndex) => {
          const { name, presenter } = columns[colIndex];
          const values =
            typeof val === "object" && Array.isArray(val) ? val : [val];
          return (
            <>
              <FieldTag key={name} name={name} size="sm" />
              {values.map((v: ESQLAtomRawValue, i: number) =>
                presenter(esqlRawToHashableValue(v))
              )}
            </>
          );
        })}
      </Wrap>
    );
  }
);

const DataTableCombinedColumn = ({ columns, rows, row_keys }: TableData) => {
  return (
    <VStack align="stretch" divider={<Divider />} spacing={3}>
      {rows.map((row, rowIndex) => (
        <DataTableCombinedColumnCell
          key={row_keys[rowIndex]}
          columns={columns}
          row={row}
        ></DataTableCombinedColumnCell>
      ))}
    </VStack>
  );
};

export default React.memo(DataTableCombinedColumn, (prevProps, nextProps) =>
  isTableDataEqual(prevProps, nextProps)
);
