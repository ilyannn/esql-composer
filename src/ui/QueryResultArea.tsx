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
import React, { useCallback, useMemo } from "react";

import { ESQLChainAction } from "../models/esql/ESQLChain";
import { countRawValues } from "../models/esql/ValueStatistics";
import { ESQLTableData } from "../services/es";
import { ESQLColumn } from "../models/esql/esql_types";

import { ChevronDownIcon } from "@chakra-ui/icons";
import { CiFilter } from "react-icons/ci";
import { GoTrash } from "react-icons/go";
import {
  esqlIsTypeSortable,
  esqlTypeToClass,
  flattenMultivalues,
} from "../models/esql/esql_types";
import { FieldInfo } from "../services/llm";
import DataTableBody from "./components/DataTableBody";
import DataTableCombinedColumn from "./components/DataTableCombinedColumn";
import SortIcon from "./components/SortIcon";
import SpinningButton from "./components/SpinningButton";
import InputNaturalPrompt from "./modals/InputNaturalPrompt";
import { TableColumn } from "./components/data-table/types";
import { getPresenter } from "./components/data-table/presenters";

interface QueryResultAreaProps {
  data: ESQLTableData | null;
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

  const handleRenameColumn = (column: ESQLColumn, newName: string) => {
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
    column: ESQLColumn,
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
      const values = data ? data.values.map((row) => row[columnIndex]) : [];
      const stats = countRawValues(flattenMultivalues(values));

      handleChainAction({
        action: "filter",
        column,
        stats,
      });
    },
    [data, handleChainAction]
  );

  const columns: TableColumn[] = useMemo(
    () =>
      (data?.columns ?? []).map((col) => ({
        name: col.name,
        type: col.type,
        presenter: getPresenter(col),
      })),
    [data]
  );

  const idColumnIndex: number = useMemo(
    () => columns.findIndex((col) => col.name === "_id"),
    [columns]
  );

  const indexColumnIndex: number = useMemo(
    () => columns.findIndex((col) => col.name === "_index"),
    [columns]
  );

  const row_keys: string[] = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.values.map((row, rowIndex) => {
      const chunks = [];
      if (indexColumnIndex !== -1) {
        chunks.push(row[indexColumnIndex]);
      }
      if (idColumnIndex !== -1) {
        chunks.push(row[idColumnIndex]);
      }
      if (chunks.length === 0) {
        chunks.push(rowIndex.toString());
      }
      return chunks.join("/");
    });
  }, [idColumnIndex, indexColumnIndex, data?.values]);

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
                  {columns.map((column, colIndex) => {
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
                          <EditablePreview
                            borderWidth={2}
                            borderColor={"transparent"}
                            style={{ fontVariant: "small-caps" }}
                          />
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
              <DataTableBody
                columns={columns}
                rows={data.values}
                row_keys={row_keys}
              />
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
          <DataTableCombinedColumn
            columns={columns}
            rows={data.values}
            row_keys={row_keys}
          />
        )}
      </VStack>
    </>
  );
};

export default QueryResultArea;
