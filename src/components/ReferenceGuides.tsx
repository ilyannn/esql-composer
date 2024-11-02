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
import React, { useCallback, useEffect } from "react";

import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import SpinningButton from "./SpinningButton";

interface ReferenceGuidesProps {
  esqlGuideText: string;
  setEsqlGuideText: (value: string) => void;
  schemaGuideText: string;
  setSchemaGuideText: (value: string) => void;
  handleWarmCache: () => Promise<void>;
  tooltipsShown: boolean;
  apiKey: string;
}

const ReferenceGuides: React.FC<ReferenceGuidesProps> = ({
  esqlGuideText,
  setEsqlGuideText,
  schemaGuideText,
  setSchemaGuideText,
  handleWarmCache,
  tooltipsShown,
  apiKey,
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

  useEffect(() => {
    loadSchemaFile("schema-flights.txt");
  }, [loadSchemaFile]);

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
        <VStack align="stretch" justify="flex-start" flex={1}>
          <FormControl
            isRequired={true}
            flex={1}
            display="flex"
            flexDirection={"column"}
          >
            <FormLabel>ES|QL Reference</FormLabel>
            <Textarea
              placeholder="Put reference material here."
              value={esqlGuideText}
              onChange={(e) => setEsqlGuideText(e.target.value)}
              flex={1}
              resize={"none"}
            />
            <HStack justify="space-evenly">
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={() => loadESQLFile("")}
              >
                Clear
              </Button>
            </HStack>
          </FormControl>
        </VStack>

        <VStack align="stretch" justify="flex-start" flex={1}>
          <FormControl
            isRequired={true}
            flex={1}
            display="flex"
            flexDirection={"column"}
          >
            <FormLabel>Schema Description</FormLabel>
            <Textarea
              placeholder="Your Elasticsearch schema reference"
              value={schemaGuideText}
              onChange={(e) => setSchemaGuideText(e.target.value)}
              flex={1}
              resize="none"
            />
            <HStack justify="space-evenly">
              <Button
                variant="ghost"
                colorScheme="green"
                onClick={() => loadSchemaFile("schema-flights.txt")}
              >
                Flights
              </Button>
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={() => loadSchemaFile("")}
              >
                Clear
              </Button>
            </HStack>
          </FormControl>
        </VStack>
        <VStack align="center" justify="flex-start">
          <Tooltip
            isDisabled={!tooltipsShown}
            label="Send a request with the current ES|QL and schema"
          >
            <SpinningButton
              type="button"
              spinningAction={handleWarmCache}
              disabled={
                !apiKey.length ||
                !esqlGuideText.length ||
                !schemaGuideText.length
              }
            >
              Warm Cache
            </SpinningButton>
          </Tooltip>
        </VStack>
      </HStack>
    </ResizableBox>
  );
};

export default ReferenceGuides;
