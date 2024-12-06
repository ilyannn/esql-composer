import {
  Button,
  CheckboxGroup,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Spacer,
  TagCloseButton,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { toInteger } from "lodash";
import React, { useState } from "react";
import { ESQLChain } from "../../models/esql/ESQLChain";
import {
  BlockHasStableId,
  ESQLBlock,
  FilterBlock,
  ValueStatistics,
} from "../../models/esql/ESQLBlock";
import { ESQLSentinelOtherValues } from "../../models/esql/esql_types";
import FieldTag from "../components/atoms/FieldTag";
import { FieldTagMesh } from "../components/FieldTagMesh";
import FilterValueCheckbox from "../components/FilterValueCheckbox";
import SortIcon from "../components/SortIcon";
import SpinningButton from "../components/SpinningButton";
import ComposerBlock, { ComposerBlockAction } from "./ComposerBlock";

interface ESQLComposerProps {
  chain: ESQLChain;
  updateBlock(index: number, block: ESQLBlock): void;
  getGlobalTopStats: (
    index: number,
    fieldName: string,
    topN: number
  ) => Promise<ValueStatistics>;
  handleBlockAction(index: number, action: ComposerBlockAction): void;
}

const sliderValues = [1, 5, 10, 20, 50, 100, 1000, null];

const toSliderValue = (limit: number | null) => {
  if (limit === null) {
    return sliderValues.length - 1;
  } else {
    return sliderValues.findIndex((stop) => stop === null || stop >= limit);
  }
};

const renderLimitBlock = (
  index: number,
  handleLimitChange: (index: number, limit: number | null) => void,
  block: ESQLBlock & BlockHasStableId & { command: "LIMIT" }
) => {
  return (
    <Slider
      value={toSliderValue(block.limit)}
      max={sliderValues.length - 1}
      onChange={(value) => handleLimitChange(index, sliderValues[value])}
      ml="2em"
      mr="2em"
    >
      {sliderValues.map((value, idx) => (
        <SliderMark
          key={idx}
          value={idx}
          mt=".5em"
          fontSize="xs"
          textAlign="center"
          transform={"translateX(-50%)"}
        >
          {value || "All"}
        </SliderMark>
      ))}
      <SliderTrack>
        <SliderFilledTrack />
      </SliderTrack>
      <SliderThumb borderColor={"blue.400"} />
    </Slider>
  );
};

const renderBlockContents = (
  index: number,
  block: ESQLBlock & BlockHasStableId,
  updateBlock: (index: number, block: ESQLBlock) => void,
  handleLimitChange: (index: number, limit: number | null) => void,
  handleWhereTopStats: (index: number, requestedFor: number) => Promise<void>
) => {
  switch (block.command) {
    case "LIMIT":
      return renderLimitBlock(index, handleLimitChange, block);

    case "DROP":
      return <FieldTagMesh size="md" fields={block.fields} />;

    case "KEEP":
      return (
        <FieldTagMesh
          size="md"
          fields={block.fields}
          setFields={(fields) => updateBlock(index, { ...block, fields })}
        />
      );

    case "WHERE":
      const onCheckValueAt = (valueIndex: number, newChecked: boolean) => {
        updateBlock(index, {
          ...block,
          values: block.values.map((f, i) =>
            i === valueIndex ? { ...f, included: newChecked } : f
          ),
        });
      };

      const onInvert = () => {
        updateBlock(index, {
          ...block,
          values: block.values.map((f) => ({ ...f, included: !f.included })),
        });
      };

      return (
        <CheckboxGroup colorScheme="blackAlpha">
          <VStack spacing={3} align="stretch">
            <HStack spacing={5} align="baseline" justify={"flex-start"}>
              <FieldTag size="lg" name={block.field} />
              <Spacer flex={2} />
              <Button variant={"ghost"} colorScheme="green" onClick={onInvert}>
                Invert
              </Button>
            </HStack>

            <Wrap spacingX={6} align={"center"}>
              {block.values.map((v, valueIndex) => {
                return (
                  <>
                    {block.topStatsRetrieved === valueIndex && (
                      <WrapItem key={"loading"}>
                        <SpinningButton
                          targets="es"
                          type="submit"
                          size="sm"
                          spinningAction={async () =>
                            handleWhereTopStats(
                              index,
                              block.topStatsRetrieved + 10
                            )
                          }
                        >
                          Get Top {block.topStatsRetrieved + 10}
                        </SpinningButton>
                      </WrapItem>
                    )}
                    {v.value === ESQLSentinelOtherValues && <Spacer />}
                    <WrapItem key={v.value.toString()}>
                      <FilterValueCheckbox
                        valueIndex={valueIndex}
                        block={block}
                        updateChecked={(newChecked) =>
                          onCheckValueAt(valueIndex, newChecked)
                        }
                      />
                    </WrapItem>
                  </>
                );
              })}
              <WrapItem key="..."></WrapItem>
            </Wrap>
          </VStack>
        </CheckboxGroup>
      );

    case "EVAL":
      return (
        <VStack spacing={2} align="stretch" justify={"flex-start"}>
          {block.expressions.map(({ field, expression }) => (
            <HStack
              spacing={3}
              align="baseline"
              justify={"flex-initial"}
              key={field}
            >
              <FieldTag size="lg" name={field} />
              <Text>←</Text>
              <Text fontFamily={"monospace"} flex={1}>
                {expression}
              </Text>
            </HStack>
          ))}
        </VStack>
      );

    case "SORT":
      return (
        <Wrap spacing={2}>
          {block.order.map((atom) => (
            <WrapItem key={atom.field}>
              <FieldTag size="lg" name={atom.field}>
                <SortIcon
                  variant={atom.sort_class}
                  ascending={atom.asc}
                  onClick={() => {
                    updateBlock(index, {
                      ...block,
                      order: block.order.map((a) =>
                        a.field === atom.field ? { ...a, asc: !a.asc } : a
                      ),
                    });
                  }}
                />
                <TagCloseButton
                  onClick={() => {
                    updateBlock(index, {
                      ...block,
                      order: block.order.filter((a) => a.field !== atom.field),
                    });
                  }}
                />
              </FieldTag>
            </WrapItem>
          ))}
        </Wrap>
      );

    case "RENAME":
      return (
        <VStack spacing={2} align="stretch" justify={"center"}>
          {Object.entries(block.map).map(
            ([oldName, newName]: [string, string], idx: number) => (
              <HStack
                key={oldName}
                align={"baseline"}
                justify={"flex-start"}
                spacing={1}
              >
                <FieldTag name={oldName} />
                <Text>→</Text>
                <FieldTag name={newName} />
              </HStack>
            )
          )}
        </VStack>
      );
  }
};

const VisualComposer: React.FC<ESQLComposerProps> = ({
  chain,
  updateBlock,
  handleBlockAction,
  getGlobalTopStats,
}) => {
  const [highlightedBlock, setHighlightedBlock] = useState<
    [number, ComposerBlockAction] | null
  >(null);

  const handleBlockHover = (
    index: number,
    action: ComposerBlockAction | null
  ) => {
    setHighlightedBlock(action && [index, action]);
  };

  const computeHighlight = (index: number) => {
    if (
      highlightedBlock === null ||
      (highlightedBlock[1] === "accept" && index > highlightedBlock[0]) ||
      (highlightedBlock[1] === "reject" && index !== highlightedBlock[0])
    ) {
      return null;
    }
    return highlightedBlock[1];
  };

  const handleLimitChange = (index: number, limit: number | null) => {
    updateBlock(index, { command: "LIMIT", limit: limit });
  };

  const handleWhereTopStats = async (index: number): Promise<void> => {
    const filterBlock = chain[index] as FilterBlock & BlockHasStableId;
    const otherValuesIncluded = filterBlock.values.some(
      (v) => v.value === ESQLSentinelOtherValues && v.included
    );
    const topN = filterBlock.topStatsRetrieved + 10;
    const topStats = await getGlobalTopStats(index, filterBlock.field, topN);
    const oldValues = new Set(filterBlock.values.map((v) => v.value));
    const newValues = new Set(Object.keys(topStats.valueCounts)).difference(
      oldValues
    );
    const valuesArray = [
      ...Array.from(newValues).map((v) => ({
        value: v,
        included: otherValuesIncluded,
      })),
      ...filterBlock.values,
    ];

    valuesArray.sort((a, b) => {
      if (
        b.value === ESQLSentinelOtherValues ||
        a.value === ESQLSentinelOtherValues
      ) {
        return (
          toInteger(a.value === ESQLSentinelOtherValues) -
          toInteger(b.value === ESQLSentinelOtherValues)
        );
      }
      return (
        (topStats.valueCounts[b.value] || 0) -
        (topStats.valueCounts[a.value] || 0)
      );
    });

    updateBlock(index, {
      ...filterBlock,
      topStatsRetrieved: topN,
      topStats,
      values: valuesArray,
    });
  };

  return (
    <VStack spacing={4} align="stretch">
      {chain.map((block: ESQLBlock & BlockHasStableId, index) => (
        <ComposerBlock
          key={block.stableId}
          command={block.command}
          highlight={computeHighlight(index)}
          onHover={(action) => {
            handleBlockHover(index, action);
          }}
          onAction={(action) => {
            handleBlockAction(index, action);
            setHighlightedBlock(null);
          }}
        >
          {renderBlockContents(
            index,
            block,
            updateBlock,
            handleLimitChange,
            handleWhereTopStats
          )}
        </ComposerBlock>
      ))}
    </VStack>
  );
};

export default VisualComposer;
