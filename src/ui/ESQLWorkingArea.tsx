import {
  Box,
  FormControl,
  HStack,
  Input,
  VStack,
  // Button,
  // Tooltip,
} from "@chakra-ui/react";
import React from "react";

import type { LLMHistoryRow } from "../common/types";

import SpinningButton from "./components/SpinningButton";

import { COMPLETION_KEY } from "./constants";
import { AutoResizeTextarea } from "./components/AutoResizeTextarea";

interface ESQLWorkingAreaProps {
  tooltipsShown: boolean;
  isESQLRequestAvailable: boolean;

  naturalInput: string;
  setNaturalInput: (value: string) => void;
  esqlInput: string;
  setEsqlInput: (value: string) => void;

  resetESQL: () => void;

  naturalInputRef: React.RefObject<HTMLInputElement | null>;
  esqlInputRef: React.RefObject<HTMLTextAreaElement | null>;
  esqlCompleteButtonRef: React.RefObject<HTMLButtonElement | null>;

  handleCompleteESQL: () => Promise<void>;
  performESQLRequest: (action: string) => Promise<void>;
}

const ESQLWorkingArea: React.FC<ESQLWorkingAreaProps> = ({
  tooltipsShown,
  isESQLRequestAvailable,

  naturalInput,
  setNaturalInput,
  esqlInput,
  setEsqlInput,

  naturalInputRef,
  esqlInputRef,
  esqlCompleteButtonRef,

  handleCompleteESQL,
  performESQLRequest,
  resetESQL,
}) => {
  const handleUpdateESQL = async () => {
    await performESQLRequest(naturalInput);
  };

  /*
    const toast = useToast();
  
    const copyESQL = () => {
      navigator.clipboard.writeText(esqlInput);
      toast({
        title: "ES|QL copied to clipboard",
        status: "success",
        duration: 750,
        isClosable: true,
      });
    };
  
  */

  return (
    <HStack justify="flex-start" align="stretch" spacing={8}>
      <VStack align={"stretch"} justify={"space-between"} flex={1}>
        <form onSubmit={(e) => e.preventDefault()}>
          <HStack>
            <FormControl flex={1}>
              <Input
                placeholder="Prompt Claude in natural language"
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                ref={naturalInputRef}
                flex={1}
              />
            </FormControl>
            <SpinningButton
              type="submit"
              spinningAction={handleUpdateESQL}
              disabled={!isESQLRequestAvailable || !naturalInput}
            >
              {esqlInput ? "Update ES|QL" : "Generate ES|QL"}
            </SpinningButton>
          </HStack>
        </form>

        <HStack align="stretch" justify="flex-start">
          <VStack spacing={0} align="stretch" flex={1}>
            <Box flex={1}>
              <AutoResizeTextarea
                flex={1}
                placeholder={"ES|QL\n\n"}
                value={esqlInput}
                ref={esqlInputRef}
                onChange={(e) => setEsqlInput(e.target.value)}
                fontFamily={"monospace"}
                whiteSpace="pre-wrap"
                style={{ background: "none" }}
                transition="height none"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === COMPLETION_KEY) {
                    e.preventDefault();
                    esqlCompleteButtonRef.current?.click();
                  }
                }}
              />
            </Box>
          </VStack>
          {/* <VStack align="stretch" justify="flex-start">
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Complete the current line"
            >
              <SpinningButton
                type="submit"
                spinningAction={handleCompleteESQL}
                disabled={!isESQLRequestAvailable || !esqlInput}
                ref={esqlCompleteButtonRef}
              >
                Complete
              </SpinningButton>
            </Tooltip>
            <Tooltip isDisabled={!tooltipsShown} label="Pretty print the ES|QL">
              <SpinningButton
                type="submit"
                spinningAction={() =>
                  performESQLRequest("Prettify the provided ES|QL")
                }
                disabled={!isESQLRequestAvailable || !esqlInput}
              >
                Prettify
              </SpinningButton>
            </Tooltip>
            <Tooltip
            isDisabled={!tooltipsShown}
            label="Reset the prompt and ES|QL and being anew."
          >
            <Button
              variant="ghost"
              colorScheme="red"
              onClick={() => resetESQL()}
            >
              Reset
            </Button>
          </Tooltip>
          </VStack> */}
        </HStack>
        {/* <HStack>
          <SpinningButton
            targets="es"
            spinningAction={fetchQueryData}
            type="submit"
            disabled={!isQueryAPIAvailable || !esqlInput}
          >
            Fetch Data
          </SpinningButton>
          <Spacer />
          <Tooltip isDisabled={!tooltipsShown} label="Copy ES|QL to Clipboard">
            <Button
              variant="ghost"
              colorScheme="green"
              isDisabled={!esqlInput}
              onClick={() => copyESQL()}
            >
              Copy
            </Button>
          </Tooltip>
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Export history of prompt and request pairs"
          >
            <Button
              variant="ghost"
              isDisabled={history.length === 0}
              colorScheme="green"
              onClick={() => showHistory()}
            >
              History
            </Button>
          </Tooltip>
        </HStack> */}
      </VStack>
    </HStack>
  );
};

export default ESQLWorkingArea;
