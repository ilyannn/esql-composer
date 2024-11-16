import { ListItem, Tbody, Td, Tr, UnorderedList } from "@chakra-ui/react";
import { isEqual } from "lodash";
import React from "react";

interface DataTableBodyProps {
  values: any[][];
}

const DataTableBody = ({ values }: DataTableBodyProps) => {
  return (
    <Tbody>
      {values.map((row, rowIndex) => (
        <Tr key={rowIndex}>
          {row.map((val, colIndex) => (
            <Td key={colIndex}>
              {typeof val === "object" && Array.isArray(val) ? (
                <UnorderedList>
                  {val.map((v: any, i: number) => (
                    <ListItem key={i}>{v}</ListItem>
                  ))}
                </UnorderedList>
              ) : (
                val
              )}
            </Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  );
};

export default React.memo(DataTableBody, (prevProps, nextProps) => {
  return isEqual(prevProps.values, nextProps.values);
});
