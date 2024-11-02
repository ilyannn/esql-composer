import React from 'react';
import { HStack, Text, Tooltip } from '@chakra-ui/react';
import ClockLoader from 'react-spinners/ClockLoader';

interface CacheWarmedNoticeProps {
  cacheWarmedText: string | null;
  tooltipsShown: boolean;
}

const CacheWarmedNotice: React.FC<CacheWarmedNoticeProps> = React.memo(({
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
      <HStack align="center" justify="flex-start">
        <ClockLoader color="#49c325" size={16} speedMultiplier={0.15} />
        <Text fontSize="sm">{cacheWarmedText}</Text>
      </HStack>
    </Tooltip>
  );
});

export default CacheWarmedNotice;