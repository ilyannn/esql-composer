import React from "react";
import { HStack, Text, Tooltip, VStack } from "@chakra-ui/react";

interface RecordViewProps {
  record: Record<string, string>;
  keyColumnWidth?: number;
  labelColumnMaxWidth?: number;
}

const RecordView: React.FC<RecordViewProps> = ({
  record,
  keyColumnWidth = 20,
  labelColumnMaxWidth = 120,
}) => {
  return (
    <VStack align={"stretch"} spacing={0} justify={"flex-start"}>
      {Object.entries(record).map(([key, value]) => (
        <HStack spacing={5} justify={"flex-start"} key={key}>
          <Text align={"right"} color={"gray"} w={keyColumnWidth}>
            {key}
          </Text>
          <Tooltip label={value} flex={1}>
            <Text isTruncated align="right" maxWidth={labelColumnMaxWidth}>
              {value}
            </Text>
          </Tooltip>
        </HStack>
      ))}
    </VStack>
  );
};

export default React.memo(RecordView);
