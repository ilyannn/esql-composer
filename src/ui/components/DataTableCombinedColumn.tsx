import { Box, Wrap, VStack, Divider } from "@chakra-ui/react";
import { isEqual } from "lodash";
import React from "react";
import {
  ESQLAtomRawMultivalue,
  ESQLAtomRawValue,
  esqlRawToHashableValue,
} from "../../models/esql/esql_types";
import FieldTag from "./atoms/FieldTag";
import FieldValue from "./atoms/FieldValue";

interface DataTableCombinedColumnProps {
  values: (ESQLAtomRawValue | ESQLAtomRawMultivalue)[][];
  fields: { name: string }[];
}

const DataTableCombinedColumn = ({
  values,
  fields,
}: DataTableCombinedColumnProps) => {
  return (
    <VStack align="stretch" divider={<Divider/>} spacing={3}>
      {values.map((row, rowIndex) => (
            <Box width="100%" key={rowIndex}>
              <Wrap justify={"flex-start"}>
                {row.map((val, fieldIndex) => {
                  const { name } = fields[fieldIndex];
                  const values =
                    typeof val === "object" && Array.isArray(val) ? val : [val];
                  return (
                    <>
                      <FieldTag key={name} name={name} size="sm" />
                      {values.map((v: ESQLAtomRawValue, i: number) => (
                        <FieldValue key={i} value={esqlRawToHashableValue(v)} />
                      ))}
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
  return isEqual(prevProps.values, nextProps.values);
});
