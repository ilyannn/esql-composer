import { Checkbox, HStack, Text } from "@chakra-ui/react";
import { FilterBlock, ValueStatistics } from "../../models/esql/ESQLBlock";
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

type NewType = ValueStatistics;

const getStatsText = (
  value: ESQLAtomValue,
  localStats: ValueStatistics,
  globalStats: NewType | undefined
): string => {
  const globalCount = globalStats?.valueCounts[value];

  if (globalCount === undefined) {
    const localCount = localStats.valueCounts[value];
    const localTotal = localStats.totalCount;
    return localCount && localTotal ? `${localCount}/${localTotal}` : "";
  }

  const fractionPercentage = Math.round(
    (globalCount / globalStats!.totalCount) * 100
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
