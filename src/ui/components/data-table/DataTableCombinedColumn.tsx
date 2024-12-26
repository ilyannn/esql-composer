import { Box, Wrap, VStack, Divider, WrapItem, Icon } from "@chakra-ui/react";
import React from "react";
import {
  ESQLAtomRawValue,
  esqlRawToHashableValue,
} from "../../../models/esql/esql_types";
import FieldTag from "../atoms/FieldTag";
import { TableColumn, TableData, TableRow, isTableDataEqual } from "./types";

interface DataTableCombinedColumnCellProps {
  columns: TableColumn[];
  row: TableRow;
}

const DataTableCombinedColumnCell = React.memo(
  ({ columns, row }: DataTableCombinedColumnCellProps) => {
    return (
      <Wrap justify={"flex-start"} align={"baseline"}>
        {row.map((val, colIndex) => {
          if (val === null) {
            return;
          }
          const { name, presenter } = columns[colIndex];
          const values =
            typeof val === "object" && Array.isArray(val) ? val : [val];
          return (
            <>
              <FieldTag key={name} name={name} size="sm" />
              {values.map((v: ESQLAtomRawValue, i: number) => {
                return (
                  <>
                    {i > 0 && (
                      <WrapItem
                        title="Multiple values"
                        key={`${name  }|${  i.toString()}`}
                        color={"gray.400"}
                        ml={-1}
                        mr={-1}
                      >
                        ⊕
                      </WrapItem>
                    )}
                    <WrapItem key={`${name  }-${  i.toString()}`}>
                      {presenter(esqlRawToHashableValue(v))}
                    </WrapItem>
                  </>
                );
                return;
              })}
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
