import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  StackDivider,
  Textarea,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useCallback } from "react";

import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import SpinningButton from "./components/SpinningButton";
import TokenCountNotice from "./components/TokenCountNotice";

interface ReferenceGuidesAreaProps {
  esqlGuideText: string;
  setEsqlGuideText: (value: string) => void;
  esqlGuideTokenCount: number | null;
  schemaGuideText: string;
  setSchemaGuideText: (value: string) => void;
  schemaGuideTokenCount: number | null;
  handleWarmCache: () => Promise<void>;
  handleReduceSize: () => Promise<void>;
  handleGetTokenCount: () => Promise<void>;
  tooltipsShown: boolean;
  isESQLRequestAvailable: boolean;
  isElasticsearchAPIAvailable: boolean;
  handleRetrieveSchemaFromES: () => void;
}

const ReferenceGuidesArea: React.FC<ReferenceGuidesAreaProps> = ({
  esqlGuideText,
  setEsqlGuideText,
  esqlGuideTokenCount,
  schemaGuideText,
  setSchemaGuideText,
  schemaGuideTokenCount,
  handleWarmCache,
  handleReduceSize,
  handleGetTokenCount,
  tooltipsShown,
  isESQLRequestAvailable,
  isElasticsearchAPIAvailable,
  handleRetrieveSchemaFromES
}) => {
  const loadESQLFile = async (filename: string) => {
    if (!filename) {
      setEsqlGuideText("");
      return;
    }
    axios
      .get(filename)
      .then((response) => {
        setEsqlGuideText(response.data);
      })
      .catch((error) => {
        console.error(`Error loading ${filename}:`, error);
      });
  };

  const loadSchemaFile = useCallback(
    async (filename: string) => {
      if (!filename) {
        setSchemaGuideText("");
        return;
      }
      axios
        .get(filename)
        .then((response) => {
          setSchemaGuideText(response.data);
        })
        .catch((error) => {
          console.error(`Error loading ${filename}:`, error);
        });
    },
    [setSchemaGuideText]
  );

  return (
    <ResizableBox
      width={Infinity}
      height={200}
      minConstraints={[Infinity, 200]}
      axis="y"
      resizeHandles={["se"]}
    >
      <HStack
        justify={"space-between"}
        align={"stretch"}
        spacing={8}
        height={"100%"}
        divider={<StackDivider borderColor="gray.200" />}
      >
        <VStack align="stretch" justify="flex-start" flex={1} spacing={3}>
          <FormControl
            isRequired={true}
            flex={1}
            display="flex"
            flexDirection={"column"}
          >
            <HStack justify={"space-between"}>
              <FormLabel>ES|QL Reference</FormLabel>
              <TokenCountNotice
                charCount={esqlGuideText.length}
                tokenCount={esqlGuideTokenCount}
              />
            </HStack>
            <Textarea
              placeholder="Put reference material here."
              value={esqlGuideText}
              onChange={(e) => setEsqlGuideText(e.target.value)}
              flex={1}
              resize={"none"}
            />
          </FormControl>
          <HStack justify="space-evenly">
            <Button
              variant="ghost"
              colorScheme="red"
              onClick={() => loadESQLFile("")}
            >
              Clear
            </Button>
          </HStack>
        </VStack>

        <VStack align="stretch" justify="flex-start" flex={1} spacing={3}>
          <FormControl
            isRequired={true}
            flex={1}
            display="flex"
            flexDirection={"column"}
          >
            <HStack justify={"space-between"}>
              <FormLabel>Schema Description</FormLabel>
              <TokenCountNotice
                charCount={schemaGuideText.length}
                tokenCount={schemaGuideTokenCount}
              />
            </HStack>
            <Textarea
              placeholder="Your Elasticsearch schema reference"
              value={schemaGuideText}
              onChange={(e) => setSchemaGuideText(e.target.value)}
              flex={1}
              resize="none"
            />
          </FormControl>
          <HStack justify="space-evenly">
            <Button
              variant="ghost"
              colorScheme="green"
              type="button"
              disabled={!isElasticsearchAPIAvailable}
              onClick={async () => handleRetrieveSchemaFromES()}
            >
              From ES...
            </Button>
            <Button
              variant="ghost"
              colorScheme="green"
              onClick={() => loadSchemaFile("schema-flights.txt")}
            >
              Demo
            </Button>
            <Button
              variant="ghost"
              colorScheme="red"
              onClick={() => loadSchemaFile("")}
            >
              Clear
            </Button>
          </HStack>
        </VStack>
        <VStack align="stretch" justify="flex-start">
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Query the API to learn the token count"
          >
            <SpinningButton
              type="button"
              spinningAction={handleGetTokenCount}
              gratisAction={true}
              disabled={!isESQLRequestAvailable}
            >
              Count Tokens
            </SpinningButton>
          </Tooltip>
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Send a request with the current ES|QL and schema"
          >
            <SpinningButton
              type="button"
              spinningAction={handleWarmCache}
              disabled={!isESQLRequestAvailable}
            >
              Warm Cache
            </SpinningButton>
          </Tooltip>
          <Tooltip
              isDisabled={!tooltipsShown}
              label="Ask the LLM to reduce the size of the guides"
            >
              <SpinningButton
                type="button"
                spinningAction={handleReduceSize}
                disabled={!isESQLRequestAvailable}
              >
                Reduce Size
              </SpinningButton>
            </Tooltip>
        </VStack>
      </HStack>
    </ResizableBox>
  );
};

export default ReferenceGuidesArea;
