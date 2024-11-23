import React, { useState } from "react";
import {
  VStack,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  TagRightIcon,
  HStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { BlockHasStableId, ESQLBlock, ESQLChain } from "../../models/esql";
import ComposerBlock, { ComposerBlockAction } from "./ComposerBlock";
import { GoSortAsc, GoSortDesc } from "react-icons/go";
import FieldTag from "../components/FieldTag";
import { FieldTagMesh } from "../components/FieldTagMesh";

interface ESQLComposerProps {
  chain: ESQLChain;
  updateBlock(index: number, block: ESQLBlock): void;
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
  handleLimitChange: (index: number, limit: number | null) => void
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
      return <Text>{block.field}</Text>;
    case "EVAL":
      return (
        <VStack spacing={2} align="stretch" justify={"flex-start"}>
          {block.expressions.map(({ field, expression }) => (
            <HStack spacing={3} align="baseline" justify={"flex-initial"} key={field}>
              <FieldTag size="lg" name={field}/>
              <Text>←</Text>
              <Text fontFamily={"monospace"} flex={1}>{expression}</Text>
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
                <TagRightIcon as={atom.asc ? GoSortAsc : GoSortDesc} />
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
          {renderBlockContents(index, block, updateBlock, handleLimitChange)}
        </ComposerBlock>
      ))}
    </VStack>
  );
};

export default VisualComposer;
