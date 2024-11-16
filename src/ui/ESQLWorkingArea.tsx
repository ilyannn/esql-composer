import {
  Box,
  Button,
  FormControl,
  HStack,
  Input,
  Textarea,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import autosize from "autosize";
import React, { useEffect } from "react";

import type { HistoryRow } from "../common/types";

import SpinningButton from "./components/SpinningButton";

import { COMPLETION_KEY } from "./constants";

interface ESQLWorkingAreaProps {
  tooltipsShown: boolean;
  isESQLRequestAvailable: boolean;

  naturalInput: string;
  setNaturalInput: (value: string) => void;
  esqlInput: string;
  setEsqlInput: (value: string) => void;

  history: HistoryRow[];
  resetESQL: () => void;

  naturalInputRef: React.RefObject<HTMLInputElement>;
  esqlInputRef: React.RefObject<HTMLTextAreaElement>;
  esqlCompleteButtonRef: React.RefObject<HTMLButtonElement>;

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

  const revertUpdate = () => {
    if (history.length > 0) {
      const last = history.pop();
      if (last) {
        setNaturalInput(last.text);
        setEsqlInput(last.esqlInput);
      }
    }
  };

  const showHistory = () => {
    const jsonHistory = JSON.stringify(history, null, 2);
    const newWindow = window.open();
    if (newWindow !== null) {
      newWindow.document.write(`<pre>${jsonHistory}</pre>`);
    } else {
      toast({
        title: "Pop-up blocked",
        description: "Please allow pop-ups to show history",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };*/

  useEffect(() => {
    // https://github.com/chakra-ui/chakra-ui/issues/670#issuecomment-625770981
    const esqlInputRefValue = esqlInputRef.current;
    if (esqlInputRefValue) {
      autosize(esqlInputRefValue);
    }
    return () => {
      if (esqlInputRefValue) {
        autosize.destroy(esqlInputRefValue);
      }
    };
  }, [esqlInputRef]);

  return (
    <HStack justify="flex-start" align="stretch" spacing={8}>
      <VStack align={"stretch"} justify={"space-between"} flex={1}>
        <form onSubmit={(e) => e.preventDefault()}>
          <HStack>
            <FormControl flex={1}>
              <Input
                placeholder="Natural Text"
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
            {/* <Tooltip
              isDisabled={!tooltipsShown}
              label="Restore the inputs to the state before this button was pressed"
            >
              <Button
                variant="ghost"
                isDisabled={history.length === 0}
                colorScheme="green"
                onClick={() => revertUpdate()}
              >
                Undo
              </Button>
            </Tooltip> */}
          </HStack>
        </form>

        <HStack align="stretch" justify="flex-start">
          <VStack spacing={0} align="stretch" flex={1}>
            <Box flex={1}>
              <Textarea
                flex={1}
                placeholder="ES|QL"
                value={esqlInput}
                ref={esqlInputRef}
                onChange={(e) => setEsqlInput(e.target.value)}
                fontFamily={"monospace"}
                whiteSpace="pre-wrap"
                style={{ height: "auto", background: "none" }}
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
          <VStack align="stretch" justify="flex-start">
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
            <Tooltip
            isDisabled={!tooltipsShown}
            label="Reset the prompt and ES|QL and being anew."
          >
            <Button
              variant="ghost"
              colorScheme="red"
              isDisabled={!esqlInput && !naturalInput}
              onClick={() => resetESQL()}
            >
              Reset
            </Button>
          </Tooltip>
          </VStack>
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
