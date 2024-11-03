import React, { useState } from "react";
import {
  Box,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { performESQLQuery, TableData } from "../services/es";
import SpinningButton from "./components/SpinningButton";

interface QueryResultAreaProps {
  query: string;
}

const QueryResultArea: React.FC<QueryResultAreaProps> = ({ query }) => {
  const [data, setData] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const response = await performESQLQuery({ query });
      setData(response);
    } catch (err) {
      setError(`Error fetching data from Elasticsearch: ${err}`);
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <SpinningButton
          targets="es"
          spinningAction={fetchData}
          type="submit"
          disabled={!query}
        >
          Fetch Data{" "}
        </SpinningButton>

        {error && <Text color="red.500">{error}</Text>}

        {data && (
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
        )}
      </VStack>
    </Box>
  );
};

export default QueryResultArea;
