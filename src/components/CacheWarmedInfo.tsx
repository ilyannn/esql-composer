import { HStack, Text, Tooltip } from "@chakra-ui/react";
import React from "react";
import ClockLoader from "react-spinners/ClockLoader";

interface CacheWarmedInfoProps {
  cacheWarmedText: string;
  tooltipsShown: boolean;
}

const CacheWarmedInfo: React.FC<CacheWarmedInfoProps> = ({
  cacheWarmedText,
  tooltipsShown,
}) => {
  if (!cacheWarmedText) {
    return null;
  }

  return (
    <Tooltip
      isDisabled={!tooltipsShown}
      label="Time since the current values were put into the cache"
    >
      <HStack align={"center"} justify={"flex-start"}>
        <ClockLoader color="#49c325" size={16} speedMultiplier={0.15} />
        <Text fontSize={"sm"}>{cacheWarmedText}</Text>
      </HStack>
    </Tooltip>
  );
};

export default CacheWarmedInfo;
