import { Tbody, Td, Tr } from "@chakra-ui/react";
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
            <Td key={colIndex}>{val}</Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  );
};

export default React.memo(DataTableBody, (prevProps, nextProps) => {
  return isEqual(prevProps.values, nextProps.values);
});
