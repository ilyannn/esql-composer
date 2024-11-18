import {
  Button,
  HStack,
  Checkbox,
  Table,
  TableContainer,
  Tooltip,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
  IconButton,
  Editable,
  EditablePreview,
  EditableInput,
  Spacer,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  useDisclosure,
  CloseButton,
} from "@chakra-ui/react";
import React from "react";

import { TableData } from "../services/es";
import { ESQLChainAction } from "../models/esql";

import { GoSortAsc, GoSortDesc, GoFilter, GoTrash } from "react-icons/go";
import SpinningButton from "./components/SpinningButton";
import DataTableBody from "./components/DataTableBody";

interface QueryResultAreaProps {
  data: TableData | null;
  clearData: () => void;
  isFetchAvailable: boolean;
  fetchQueryData: () => Promise<void>;
  tooltipsShown: boolean;
  autoUpdate: boolean;
  setAutoUpdate: (value: boolean) => void;
  isLimitRecommended: boolean;
  isKeepRecommended: boolean;
  updatingESQLLineByLine: boolean;
  handleChainActionInContext: (
    action: ESQLChainAction,
    knownFields: string[]
  ) => boolean;
}

const QueryResultArea: React.FC<QueryResultAreaProps> = ({
  data,
  autoUpdate,
  setAutoUpdate,
  tooltipsShown,
  clearData,
  handleChainActionInContext,
  isFetchAvailable,
  isLimitRecommended,
  isKeepRecommended,
  updatingESQLLineByLine,
  fetchQueryData,
}) => {
  const { isOpen: isLimitWarningVisible, onClose: closeLimitWarning } =
    useDisclosure({ defaultIsOpen: true });

  const handleChainAction = (action: ESQLChainAction): boolean => {
    const knownFields = data?.columns.map((col) => col.name) ?? [];
    return handleChainActionInContext(action, knownFields);
  };

  const handleRenameField = (field: string, newName: string) => {
    if (field === newName) {
      return;
    }

    handleChainAction({
      action: "rename",
      field,
      newName,
    });
  };

  return (
    <>
      <VStack spacing={4} align="stretch">
        {isLimitRecommended && isLimitWarningVisible && (
          <Alert status="warning">
            <AlertIcon />
            <HStack
              align={"center"}
              justify={"flex-start"}
              spacing={2}
              flex={1}
            >
              <AlertTitle mr={2}>Limit recommended.</AlertTitle>
              <AlertDescription flex={1}>
                Set the limit below to avoid fetching too much data.
              </AlertDescription>
              <CloseButton
                alignSelf="flex-start"
                position="relative"
                right={-1}
                top={-1}
                onClick={closeLimitWarning}
              />
            </HStack>
          </Alert>
        )}

        <HStack align="center" justify={"flex-start"} spacing={6}>

          <SpinningButton
            targets="es"
            spinningAction={fetchQueryData}
            type="submit"
            disabled={!isFetchAvailable}
          >
            Fetch Data
          </SpinningButton>

          <Tooltip
            isDisabled={!tooltipsShown}
            label="Fetch new data after every change"
          >
            <Checkbox
              id="auto-update"
              colorScheme="teal"
              isChecked={autoUpdate}
              disabled={!isFetchAvailable && !autoUpdate}
              opacity={updatingESQLLineByLine && autoUpdate ? 0.7 : 1}
              onChange={(e) => setAutoUpdate(e.target.checked)}
            >
              Automatically
            </Checkbox>
          </Tooltip>

          <Spacer />

          {isLimitRecommended &&
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Set the limit below to avoid fetching too much data"
            >
              <Button
                variant="ghost"
                colorScheme="green"
                onClick={() => handleChainAction({ action: "limit" })}
              >
                Add Limit
              </Button>
            </Tooltip>
          }

          {isKeepRecommended &&
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Add a KEEP clause to move around or select the columns"
            >
              <Button
                variant="ghost"
                colorScheme="green"
                onClick={() => handleChainAction({ action: "keep" })}
                disabled={!data}
              >
                Manage Columns
              </Button>
            </Tooltip>
          }

          {data && (
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Hide the table section until data is fetched again"
            >
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={clearData}
                disabled={!data}
              >
                Hide Table
              </Button>
            </Tooltip>
          )}

        </HStack>

        {data && (
          <TableContainer>
            <Table variant="striped" colorScheme="teal" size="sm">
              <Thead>
                <Tr>
                  {data.columns.map((col, colIndex) => {
                    return (
                      <Th
                        key={col.name}
                        textTransform="none"
                        fontFamily={"sans-serif"}
                        fontSize={"md"}
                      >
                        <Editable
                          defaultValue={col.name}
                          submitOnBlur={false}
                          onSubmit={(value) =>
                            handleRenameField(col.name, value)
                          }
                        >
                          <EditablePreview />
                          <EditableInput />
                        </Editable>
                        <IconButton
                          variant={"ghost"}
                          colorScheme="gray"
                          aria-label="Sort Ascending"
                          icon={<GoSortAsc />}
                          onClick={() =>
                            handleChainAction({
                              action: "sortAsc",
                              field: col.name,
                            })
                          }
                        />
                        <IconButton
                          variant={"ghost"}
                          colorScheme="gray"
                          aria-label="Sort Descending"
                          icon={<GoSortDesc />}
                          onClick={() =>
                            handleChainAction({
                              action: "sortDesc",
                              field: col.name,
                            })
                          }
                        />
                        <IconButton
                          variant={"ghost"}
                          colorScheme="gray"
                          aria-label="Filter Field"
                          icon={<GoFilter />}
                          onClick={() =>
                            handleChainAction({
                              action: "filter",
                              field: col.name,
                            })
                          }
                        />
                        <IconButton
                          variant={"ghost"}
                          colorScheme="gray"
                          aria-label="Hide Field"
                          icon={<GoTrash />}
                          onClick={() =>
                            handleChainAction({
                              action: "drop",
                              field: col.name,
                            })
                          }
                        />
                      </Th>
                    );
                  })}
                </Tr>
              </Thead>
              <DataTableBody values={data.values} />
              <Tfoot>
                <Tr opacity={0.33}>
                  {data.columns.map((col, colIndex) => (
                    <Th key={colIndex}>{col.type}</Th>
                  ))}
                </Tr>
              </Tfoot>
            </Table>
          </TableContainer>
        )}
      </VStack>
    </>
  );
};

export default QueryResultArea;
