import React from "react";
import { Box, Button, Heading, HStack, Spacer } from "@chakra-ui/react";

export type ComposerBlockAction = "accept" | "reject";

interface ComposerBlockProps {
  command: string;
  children?: React.ReactNode;
  highlight: ComposerBlockAction | null;
  onHover(action: ComposerBlockAction | null): void;
  onAction(action: ComposerBlockAction): void;
}

const ComposerBlock: React.FC<ComposerBlockProps> = ({
  command,
  children,
  highlight,
  onHover,
  onAction,
}) => {
  return (
    <Box
      border="1px solid"
      borderColor="gray.700"
      borderRadius="lg"
      p={4}
      bg={
        highlight === "accept"
          ? "green.50"
          : highlight === "reject"
          ? "red.50"
          : "white"
      }
    >
      <HStack justify="space-between" align="baseline" spacing={6}>
        <Heading as="h4" size={"md"} textColor={"gray.700"}>{command}</Heading>
        {children}
        <Spacer />
        <HStack spacing={2}>
          <Button
            variant="outline"
            borderColor={highlight === "accept" ? "green.500" : "green.200"}
            colorScheme="green"
            onMouseEnter={() => onHover("accept")}
            onMouseLeave={() => onHover(null)}
            onClick={() => onAction("accept")}
          >
            Accept ⇧
          </Button>
          <Button
            variant="outline"
            borderColor={highlight === "reject" ? "red.500" : "red.200"}
            colorScheme="red"
            onMouseEnter={() => onHover("reject")}
            onMouseLeave={() => onHover(null)}
            onClick={() => onAction("reject")}
          > 
            Reject ⇩
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
};

export default ComposerBlock;
