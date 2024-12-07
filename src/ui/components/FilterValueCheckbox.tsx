import { Checkbox, HStack, Text } from "@chakra-ui/react";
import { FilterBlock } from "../../models/esql/ESQLBlock";
import { getValueCount, ValueStatistics } from "../../models/esql/ValueStatistics";
import {
  ESQLAtomValue,
  ESQLSentinelOtherValues,
} from "../../models/esql/esql_types";
import FieldValue from "./atoms/FieldValue";

interface FilterValueCheckboxProps {
  valueIndex: number;
  block: FilterBlock;
  updateChecked: (newChecked: boolean) => void;
}

const getStatsText = (
  value: ESQLAtomValue,
  localStats: ValueStatistics,
  globalStats: ValueStatistics | undefined
): string => {
  const globalCount = getValueCount(value, globalStats);

  if (globalStats === undefined || globalCount === undefined) {
    const localCount = getValueCount(value, localStats);
    const localTotal = localStats.totalCount;
    return localCount && localTotal ? `${localCount}/${localTotal}` : "";
  }

  const fractionPercentage = Math.round(
    (globalCount / globalStats.totalCount) * 100
  );

  if (fractionPercentage === 0) {
    return "";
  }

  return `${fractionPercentage}%`;
};

export const FilterValueCheckbox = ({
  valueIndex,
  block,
  updateChecked,
}: FilterValueCheckboxProps) => {
  const v = block.values[valueIndex];
  const statsText =
    v.value === ESQLSentinelOtherValues
      ? undefined
      : getStatsText(v.value, block.localStats, block.topStats);

  return (
    <>
      <Checkbox
        isChecked={v.included}
        onChange={(e) => {
          updateChecked(e.target.checked);
        }}
      >
        <HStack spacing={2} align={"baseline"}>
          <FieldValue value={v.value} />
          {statsText !== "" && (
            <Text color={"gray.500"} fontSize={"xs"}>
              {statsText}
            </Text>
          )}
        </HStack>
      </Checkbox>
    </>
  );
};

export default FilterValueCheckbox;
