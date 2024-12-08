import { ListItem, Tbody, Td, Tr, UnorderedList } from "@chakra-ui/react";
import { isEqual } from "lodash";
import React from "react";
import {
  ESQLAtomRawMultivalue,
  ESQLAtomRawValue,
  esqlRawToHashableValue,
} from "../../models/esql/esql_types";
import { createPresenters, Presenter } from "./data-table/presenters";
import { ESQLColumn } from "../../models/esql/esql_types";

interface DataTableBodyProps {
  columns: ESQLColumn[];
  values: (ESQLAtomRawValue | ESQLAtomRawMultivalue)[][];
}

const DataTableBody = ({ values, columns }: DataTableBodyProps) => {
  const presenters = createPresenters(columns);

  return (
    <Tbody>
      {values.map((row, rowIndex) => (
        <Tr key={rowIndex}>
          {row.map((val, colIndex) => {
            const presenter = presenters[colIndex];
            return (
              <Td key={colIndex}>
                {typeof val === "object" && Array.isArray(val) ? (
                  <UnorderedList>
                    {val.map((v: ESQLAtomRawValue, i: number) => (
                      <ListItem key={i}>
                        {presenter(esqlRawToHashableValue(v))}
                      </ListItem>
                    ))}
                  </UnorderedList>
                ) : (
                  presenter(esqlRawToHashableValue(val))
                )}
              </Td>
            );
          })}
        </Tr>
      ))}
    </Tbody>
  );
};

export default React.memo(DataTableBody, (prevProps, nextProps) => {
  return (
    isEqual(prevProps.columns, nextProps.columns) &&
    isEqual(prevProps.values, nextProps.values)
  );
});
