import { ListItem, Tbody, Td, Tr, UnorderedList } from "@chakra-ui/react";
import { isEqual } from "lodash";
import React, { useMemo } from "react";
import {
  ESQLAtomRawMultivalue,
  ESQLAtomRawValue,
  esqlRawToHashableValue,
} from "../../models/esql/esql_types";
import { isTableDataEqual, TableColumn, TableData } from "./data-table/types";
import { Presenter } from "./data-table/presenters";

interface DataTableCellProps {
  presenter: Presenter;
  value: ESQLAtomRawValue | ESQLAtomRawMultivalue;
}

const DataTableCell = React.memo(({ presenter, value }: DataTableCellProps) => (
  <Td>
    {typeof value === "object" && Array.isArray(value) ? (
      <UnorderedList>
        {value.map((v: ESQLAtomRawValue, i: number) => (
          <ListItem key={i}>{presenter(esqlRawToHashableValue(v))}</ListItem>
        ))}
      </UnorderedList>
    ) : (
      presenter(esqlRawToHashableValue(value))
    )}
  </Td>
));

const DataTableBody = ({ rows, columns, row_keys }: TableData) => {
  return (
    <Tbody>
      {rows.map((row, rowIndex) => (
        // TODO: Documents might come from different indices or clusters, so this key should be extended.
        <Tr key={row_keys[rowIndex]}>
          {row.map((val, colIndex) => (
            <DataTableCell
              key={columns[colIndex].name}
              presenter={columns[colIndex].presenter}
              value={val}
            />
          ))}
        </Tr>
      ))}
    </Tbody>
  );
};

export default React.memo(DataTableBody, (prevProps, nextProps) =>
  isTableDataEqual(prevProps, nextProps)
);
