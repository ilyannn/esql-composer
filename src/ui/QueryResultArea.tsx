import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Checkbox,
  CloseButton,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Table,
  TableContainer,
  Tfoot,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import React, { useCallback } from "react";

import { ESQLChainAction, ValueStatistics } from "../models/esql/esql";
import { TableColumn, TableData } from "../services/es";

import { ChevronDownIcon } from "@chakra-ui/icons";
import { CiFilter } from "react-icons/ci";
import { GoTrash } from "react-icons/go";
import {
  ESQLAtomValue,
  esqlIsTypeSortable,
  esqlRawToHashableValue,
  esqlTypeToClass,
} from "../models/esql/esql_types";
import { FieldInfo } from "../services/llm";
import DataTableBody from "./components/DataTableBody";
import DataTableCombinedColumn from "./components/DataTableCombinedColumn";
import SortIcon from "./components/SortIcon";
import SpinningButton from "./components/SpinningButton";
import InputNaturalPrompt from "./modals/InputNaturalPrompt";

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
  handleTransformFieldWithInfo: (
    fieldInfo: FieldInfo,
    naturalInput: string
  ) => void;
}

const QueryResultArea: React.FC<QueryResultAreaProps> = ({
  data,
  autoUpdate,
  setAutoUpdate,
  tooltipsShown,
  clearData,
  handleChainActionInContext,
  handleTransformFieldWithInfo,
  isFetchAvailable,
  isLimitRecommended,
  isKeepRecommended,
  updatingESQLLineByLine,
  fetchQueryData,
}) => {
  const { isOpen: isLimitWarningVisible, onClose: closeLimitWarning } =
    useDisclosure({ defaultIsOpen: true });

  const [isCombinedColumnView, setIsCombinedColumnView] = React.useState(false);

  const handleChainAction = useCallback(
    (action: ESQLChainAction): boolean => {
      const knownFields = data?.columns.map((col) => col.name) ?? [];
      return handleChainActionInContext(action, knownFields);
    },
    [data, handleChainActionInContext]
  );

  const handleRenameColumn = (column: TableColumn, newName: string) => {
    if (column.name === newName) {
      return;
    }

    handleChainAction({
      action: "rename",
      column,
      newName,
    });
  };

  const handleTransformColumn = (
    column: TableColumn,
    columnIndex: number,
    naturalInput: string
  ) => {
    const examples = data ? data.values.map((row) => row[columnIndex]) : [];
    const fieldInfo: FieldInfo = {
      ...column,
      examples,
    };
    handleTransformFieldWithInfo(fieldInfo, naturalInput);
  };

  const handleFilterColumn = useCallback(
    (column: TableColumn, columnIndex: number) => {
      const values = data
        ? data.values
            .map((row) => row[columnIndex])
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
        : [];

      const valueCounts = values.reduce((acc, value) => {
        const key = esqlRawToHashableValue(value);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<ESQLAtomValue, number>);

      const stats: ValueStatistics = {
        totalCount: values.length,
        valueCounts,
      };

      handleChainAction({
        action: "filter",
        column,
        stats,
      });
    },
    [data, handleChainAction]
  );

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

          {/* {isLimitRecommended && (
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
          )} */}

          {data && (
            <Menu>
              <MenuButton
                as={Button}
                variant={"ghost"}
                colorScheme="green"
                rightIcon={<ChevronDownIcon />}
              >
                Table
              </MenuButton>
              <MenuList>
                {isLimitRecommended && (
                  <MenuItem
                    onClick={() => handleChainAction({ action: "limit" })}
                  >
                    Add Limit 
                  </MenuItem>
                )}
                {isKeepRecommended && (
                  <MenuItem
                    onClick={() => handleChainAction({ action: "keep" })}
                  >
                    Manage Columns
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => setIsCombinedColumnView(!isCombinedColumnView)}
                >
                  {isCombinedColumnView ? "Separate" : "Combine"} Columns
                </MenuItem>
                <MenuItem onClick={clearData}>Hide Table</MenuItem>
              </MenuList>
            </Menu>
          )}

          {/* {isKeepRecommended && (
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
          )} */}

          {/* <Tooltip
            isDisabled={!tooltipsShown}
            label="Add a an EVAL to create a new column"
          >
            <InputNaturalPrompt
              inputLabel="Create new columns"
              onSubmit={() => {
                //                handleChainAction({ action: "eval" });
              }}
            >
              <Button variant="ghost" colorScheme="green" disabled={!data}>
                Add
              </Button>
            </InputNaturalPrompt>
          </Tooltip> */}

          {/* {data && (
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
          )} */}
        </HStack>

        {data && !isCombinedColumnView && (
          <TableContainer>
            <Table variant="striped" colorScheme="teal" size="sm">
              <Thead>
                <Tr>
                  {data.columns.map((column, colIndex) => {
                    return (
                      <Th
                        key={column.name}
                        textTransform="none"
                        fontSize={"md"}
                      >
                        <Editable
                          defaultValue={column.name}
                          submitOnBlur={false}
                          fontFamily={"sans-serif"}
                          onSubmit={(value) =>
                            handleRenameColumn(column, value)
                          }
                        >
                          <EditablePreview />
                          <EditableInput />
                        </Editable>
                        {esqlIsTypeSortable(column.type) && (
                          <>
                            <SortIcon
                              variant={esqlTypeToClass(column.type)}
                              ascending={true}
                              onClick={() =>
                                handleChainAction({
                                  action: "sortAsc",
                                  column,
                                })
                              }
                            />
                            <SortIcon
                              variant={esqlTypeToClass(column.type)}
                              ascending={false}
                              onClick={() =>
                                handleChainAction({
                                  action: "sortDesc",
                                  column,
                                })
                              }
                            />
                          </>
                        )}
                        <IconButton
                          variant={"ghost"}
                          colorScheme="gray"
                          aria-label="Filter Field"
                          icon={<CiFilter size={22} />}
                          onClick={() => handleFilterColumn(column, colIndex)}
                        />
                        <InputNaturalPrompt
                          inputLabel={`Transform field ${column.name}`}
                          onSubmit={(input) => {
                            handleTransformColumn(column, colIndex, input);
                          }}
                        >
                          <Button
                            variant={"ghost"}
                            colorScheme="gray"
                            aria-label="Transform Field"
                          >
                            <span style={{ fontFamily: "cursive" }}>f</span>
                          </Button>
                        </InputNaturalPrompt>
                        <IconButton
                          variant={"ghost"}
                          colorScheme="gray"
                          aria-label="Hide Field"
                          icon={<GoTrash />}
                          onClick={() =>
                            handleChainAction({
                              action: "drop",
                              column,
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

        {data && isCombinedColumnView && (
          <DataTableCombinedColumn fields={data.columns} values={data.values} />
        )}
      </VStack>
    </>
  );
};

export default QueryResultArea;
