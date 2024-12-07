import { Box, Wrap, VStack, Divider } from "@chakra-ui/react";
import { isEqual } from "lodash";
import React from "react";
import {
  ESQLAtomRawMultivalue,
  ESQLAtomRawValue,
  esqlRawToHashableValue,
} from "../../models/esql/esql_types";
import FieldTag from "./atoms/FieldTag";
import { createPresenters, type Presenter } from "./data-table/presenters";
import { TableColumn } from "../../services/es";

interface DataTableCombinedColumnProps {
  columns: TableColumn[];
  values: (ESQLAtomRawValue | ESQLAtomRawMultivalue)[][];
}

const DataTableCombinedColumn = ({
  columns,
  values,
}: DataTableCombinedColumnProps) => {
  const presenters = createPresenters(columns);

  return (
    <VStack align="stretch" divider={<Divider />} spacing={3}>
      {values.map((row, rowIndex) => (
        <Box width="100%" key={rowIndex}>
          <Wrap justify={"flex-start"}>
            {row.map((val, fieldIndex) => {
              const { name } = columns[fieldIndex];
              const values =
                typeof val === "object" && Array.isArray(val) ? val : [val];
              return (
                <>
                  <FieldTag key={name} name={name} size="sm" />
                  {values.map((v: ESQLAtomRawValue, i: number) =>
                    presenters[fieldIndex](esqlRawToHashableValue(v))
                  )}
                </>
              );
            })}
          </Wrap>
        </Box>
      ))}
    </VStack>
  );
};

export default React.memo(DataTableCombinedColumn, (prevProps, nextProps) => {
  return (
    isEqual(prevProps.columns, nextProps.columns) &&
    isEqual(prevProps.values, nextProps.values)
  );
});
