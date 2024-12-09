import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  StackDivider,
  Textarea,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import React, { useCallback } from "react";

import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import SpinningButton from "./components/SpinningButton";
import TokenCountNotice from "./components/TokenCountNotice";
import { ESQLSchema } from "../services/es/derive_schema";
import axios from "axios";
import { ChevronUpIcon } from "@chakra-ui/icons";

interface ReferenceGuidesAreaProps {
  esqlGuideText: string;
  setEsqlGuideText: (value: string) => void;
  esqlGuideTokenCount: [string, number] | null;
  schemaGuideText: string;
  setSchemaGuideText: (value: string) => void;
  setSchemaGuideJSON: (value: ESQLSchema | null) => void;
  schemaGuideTokenCount: [string, number] | null;
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
  setSchemaGuideJSON,
  schemaGuideTokenCount,
  handleWarmCache,
  handleReduceSize,
  handleGetTokenCount,
  tooltipsShown,
  isESQLRequestAvailable,
  isElasticsearchAPIAvailable,
  handleRetrieveSchemaFromES,
}) => {
  const loadESQLFile = useCallback(
    async (filename: string) => {
      try {
        const request = await axios.get(filename, { responseType: "text" });
        setEsqlGuideText(request.data);
      } catch (error) {
        console.error(`Error loading ${filename}:`, error);
      }
    },
    [setEsqlGuideText]
  );

  const loadSchemaFile = useCallback(
    async (filename: string) => {
      try {
        const request = await axios.get(filename, { responseType: "json" });
        setSchemaGuideJSON(request.data);
      } catch (error) {
        console.error(`Error loading ${filename} as JSON:`, error);
      }
    },
    [setSchemaGuideJSON]
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
          <FormControl flex={1} display="flex" flexDirection={"column"}>
            <HStack justify={"space-between"}>
              <FormLabel>ES|QL Reference</FormLabel>
              <TokenCountNotice
                charCount={esqlGuideText.length}
                tokenCount={
                  esqlGuideTokenCount &&
                  esqlGuideTokenCount[0] === esqlGuideText
                    ? esqlGuideTokenCount[1]
                    : null
                }
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
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Load a prepackaged ES|QL reference file (shorter version)"
            >
              <Button
                variant="ghost"
                colorScheme="green"
                onClick={() => loadESQLFile("esql-short.txt")}
              >
                Syntax
              </Button>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Load a prepackaged ES|QL reference file (longer version, contains all functions)"
            >
              <Button
                variant="ghost"
                colorScheme="green"
                onClick={() => loadESQLFile("esql-long.txt")}
              >
                Syntax + Functions
              </Button>
            </Tooltip>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Remove the ES|QL reference"
            >
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={() => setEsqlGuideText("")}
              >
                Clear
              </Button>
            </Tooltip>
          </HStack>
        </VStack>

        <VStack align="stretch" justify="flex-start" flex={1} spacing={3}>
          <FormControl flex={1} display="flex" flexDirection={"column"}>
            <HStack justify={"space-between"}>
              <FormLabel>Schema Description</FormLabel>
              <TokenCountNotice
                charCount={schemaGuideText.length}
                tokenCount={
                  schemaGuideTokenCount &&
                  schemaGuideTokenCount[0] === schemaGuideText
                    ? schemaGuideTokenCount[1]
                    : null
                }
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
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Open a dialog to generate schema description from your Elasticsearch data"
            >
              <Button
                variant="ghost"
                colorScheme="green"
                type="button"
                disabled={!isElasticsearchAPIAvailable}
                onClick={async () => handleRetrieveSchemaFromES()}
              >
                From ES...
              </Button>
            </Tooltip>

            <Tooltip
              isDisabled={!tooltipsShown}
              label="Load a prepackaged schema description"
            >
              <Menu placement="top">
                <MenuButton
                  as={Button}
                  variant="ghost"
                  colorScheme="green"
                  rightIcon={<ChevronUpIcon />}
                >
                  Demo
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => loadSchemaFile("demo-flights.json")}>
                    Flights
                  </MenuItem>
                  <MenuItem
                    onClick={() => loadSchemaFile("demo-ecommerce.json")}
                  >
                    E-Commerce
                  </MenuItem>
                </MenuList>
              </Menu>
            </Tooltip>

            <Tooltip
              isDisabled={!tooltipsShown}
              label="Remove the schema description"
            >
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={() => setSchemaGuideJSON(null)}
              >
                Clear
              </Button>
            </Tooltip>
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
