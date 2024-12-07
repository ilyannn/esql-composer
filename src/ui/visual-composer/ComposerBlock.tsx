import React from "react";
import { Box, Button, Heading, HStack, Spacer } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

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
      borderColor={
        highlight === "accept"
          ? "green.500"
          : highlight === "reject"
          ? "red.500"
          : "gray.700"
      }
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
      <HStack justify="flex-start" align="baseline" spacing={6}>
        <Heading as="h4" size={"sm"} textColor={"purple"}>
          {command}
        </Heading>
        <Box flex="1">{children}</Box>
        <HStack spacing={2} justify={"normal"} flex="none">
          <Button
            variant="ghost"
            colorScheme="green"
            onMouseEnter={() => onHover("accept")}
            onMouseLeave={() => onHover(null)}
            onClick={() => onAction("accept")}
          >
            Accept ⇧
          </Button>
          <Button
            variant="ghost"
            colorScheme="red"
            onMouseEnter={() => onHover("reject")}
            onMouseLeave={() => onHover(null)}
            onClick={() => onAction("reject")}
          >
            <CloseIcon />
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
};

export default ComposerBlock;
