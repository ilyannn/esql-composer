import {
  IconButton,
  ListItem,
  Tbody,
  Td,
  Tr,
  UnorderedList,
} from "@chakra-ui/react";
import { isEqual } from "lodash";
import React, { useMemo } from "react";
import {
  ESQLAtomRawMultivalue,
  ESQLAtomRawValue,
  esqlRawToHashableValue,
} from "../../../models/esql/esql_types";
import { isTableDataEqual, TableColumn, TableData } from "../data-table/types";
import { Presenter } from "../data-table/presenters";
import { BsChevronBarExpand } from "react-icons/bs";

interface DataTableSingleValueCellProps {
  presenter: Presenter;
  value: ESQLAtomRawValue;
}

interface DataTableMultiValueCellProps {
  presenter: Presenter;
  values: ESQLAtomRawMultivalue;
  onExpand: () => void;
}

const DataTableSingleValueCell: React.FC<DataTableSingleValueCellProps> =
  React.memo(({ presenter, value }) => (
    <Td>{presenter(esqlRawToHashableValue(value))}</Td>
  ));

const DataTableMultiValueCell = React.memo(
  ({ presenter, values, onExpand }: DataTableMultiValueCellProps) => (
    <Td position="relative">
      <UnorderedList>
        {values.map((v: ESQLAtomRawValue, i: number) => (
          <ListItem key={i}>{presenter(esqlRawToHashableValue(v))}</ListItem>
        ))}
      </UnorderedList>
      <IconButton
        aria-label="Expand"
        onClick={onExpand}
        icon={<BsChevronBarExpand />}
        variant={"ghost"}
        size="sm"
        position="absolute"
        top="1"
        right="1"
      />
    </Td>
  ),
);

interface DataTableBodyProps {
  data: TableData;
  onExpand: (columnIndex: number) => void;
}

const DataTableBody = ({ data, onExpand }: DataTableBodyProps) => {
  const { rows, columns, row_keys } = data;

  return (
    <Tbody>
      {rows.map((row, rowIndex) => (
        <Tr key={row_keys[rowIndex]}>
          {row.map((val, colIndex) =>
            typeof val === "object" && Array.isArray(val) ? (
              <DataTableMultiValueCell
                key={columns[colIndex].name}
                presenter={columns[colIndex].presenter}
                values={val}
                onExpand={() => onExpand(colIndex)}
              />
            ) : (
              <DataTableSingleValueCell
                key={columns[colIndex].name}
                presenter={columns[colIndex].presenter}
                value={val}
              />
            ),
          )}
        </Tr>
      ))}
    </Tbody>
  );
};

export default React.memo(DataTableBody, (prevProps, nextProps) =>
  isTableDataEqual(prevProps.data, nextProps.data),
);
