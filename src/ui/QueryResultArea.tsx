import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import React from "react";

import { TableData } from "../services/es";

interface QueryResultAreaProps {
  data: TableData | null;
}

const QueryResultArea: React.FC<QueryResultAreaProps> = ({ data }) => {
  return data && (
      <VStack spacing={4} align="stretch">
        <TableContainer>
          <Table variant="striped" colorScheme="teal">
            <Thead>
              <Tr>
                {data.columns.map((col) => (
                  <Th>{col.name}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {data.values.map((row) => (
                <Tr>
                  {row.map((val) => (
                    <Td>{val}</Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
    </VStack>
  );
};

export default QueryResultArea;
