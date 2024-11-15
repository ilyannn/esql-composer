import React, { useState } from "react";
import { Button, VStack, HStack } from "@chakra-ui/react";
import { ESQLBlock, ESQLChain } from "../../models/esql";
import ComposerBlock, { ComposerBlockAction } from "./ComposerBlock";

interface ESQLComposerProps {
  chain: ESQLChain;
  updateBlock(index: number, block: ESQLBlock): void;
  handleBlockAction(index: number, action: ComposerBlockAction): void;
}

const VisualComposer: React.FC<ESQLComposerProps> = ({
  chain,
  updateBlock,
  handleBlockAction,
}) => {
  const [highlightedBlock, setHighlightedBlock] = useState<
    [number, ComposerBlockAction] | null
  >(null);

  const handleBlockHover = (index: number, action: ComposerBlockAction | null) => {
    setHighlightedBlock(action && [index, action]);
  }

  const computeHighlight = (index: number) => {
    if (highlightedBlock === null 
      || (highlightedBlock[1] === "accept" && index > highlightedBlock[0])
      || (highlightedBlock[1] === "reject" && index < highlightedBlock[0])
    ) {
      return null;
    }
    return highlightedBlock[1];
  };
      
  const handleLimitChange = (index: number, limit: number | null) => {
    updateBlock(index, { "command": "LIMIT", "limit": limit })
  };

  return (
    <VStack spacing={4} align="stretch">
      {chain.map((block: ESQLBlock, index) => (
        <ComposerBlock
          key={index}
          command={block.command}
          highlight={computeHighlight(index)}
          onHover={(action) => {handleBlockHover(index, action)}}
          onAction={(action) => {handleBlockAction(index, action)}}
        >
          {block.command === "LIMIT" && (
            <HStack spacing={2}>
              <Button onClick={() => handleLimitChange(index, 1)}>1</Button>
              <Button onClick={() => handleLimitChange(index, 10)}>10</Button>
              <Button onClick={() => handleLimitChange(index, 20)}>20</Button>
              <Button onClick={() => handleLimitChange(index, 100)}>100</Button>
              <Button onClick={() => handleLimitChange(index, 1000)}>1000</Button>
              <Button onClick={() => handleLimitChange(index, null)}>None</Button>
            </HStack>
          )}
        </ComposerBlock>
      ))}
    </VStack>
  );
};

export default VisualComposer;
