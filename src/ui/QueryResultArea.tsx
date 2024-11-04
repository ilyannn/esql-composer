import {
  Button,
  HStack,
  Checkbox,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tooltip,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import React from "react";

import { TableData } from "../services/es";

interface QueryResultAreaProps {
  data: TableData | null;
  clearData: () => void;
  tooltipsShown: boolean;
  autoUpdate: boolean;
  setAutoUpdate: (value: boolean) => void;
}

const QueryResultArea: React.FC<QueryResultAreaProps> = ({
  data,
  autoUpdate,
  setAutoUpdate,
  tooltipsShown,
  clearData,
}) => {
  return (
    data && (
      <VStack spacing={4} align="stretch">
        <TableContainer>
          <Table variant="striped" colorScheme="teal">
            <TableCaption>
              <HStack align="center" justify={"space-between"}>
              <Tooltip
                  isDisabled={!tooltipsShown}
                  label="Automatically fetch new data after every request to the LLM"
                >
                <Checkbox
                  id="auto-update"
                  colorScheme="teal"
                  checked={autoUpdate}
                  onChange={(e) => setAutoUpdate(e.target.checked)}
                >
                  Auto-update
                </Checkbox>
                </Tooltip>
                <Tooltip
                  isDisabled={!tooltipsShown}
                  label="Hide the data section until you click the Fetch Data button again"
                >
                  <Button variant="ghost" colorScheme="red" onClick={clearData}>
                    Hide
                  </Button>
                </Tooltip>
              </HStack>
            </TableCaption>
            <Thead>
              <Tr>
                {data.columns.map((col, colIndex) => (
                  <Th key={colIndex}>{col.name}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {data.values.map((row, rowIndex) => (
                <Tr key={rowIndex}>
                  {row.map((val, colIndex) => (
                    <Td key={colIndex}>{val}</Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
            <Tfoot>
              <Tr>
                {data.columns.map((col, colIndex) => (
                  <Th key={colIndex}>{col.type}</Th>
                ))}
              </Tr>
            </Tfoot>
          </Table>
        </TableContainer>
      </VStack>
    )
  );
};

export default QueryResultArea;
