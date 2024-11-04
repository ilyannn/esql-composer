import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Button,
  Divider,
  Heading,
  Highlight,
  HStack,
  Link,
  ListItem,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { COMPLETION_KEY } from "./constants";

const CONFIG_KEY = "config";

interface HowToUseAreaProps {
  tooltipsShown: boolean;
  setTooltipsShown: (value: boolean) => void;
  collectConfig: () => Config;
  loadConfig: (config: Config) => void;
}

export interface Config {
  [key: string]: any;
}

const HowToUseArea: React.FC<HowToUseAreaProps> = React.memo(
  ({ tooltipsShown, setTooltipsShown, collectConfig, loadConfig }) => {
    const [config, storeConfig, removeConfig] = useLocalStorage<Config>(
      CONFIG_KEY,
      {}
    );
    const isConfigEmpty = Object.keys(config).length === 0;
    const loadOnMountPerformed = useRef(false);

    useEffect(() => {
      if (loadOnMountPerformed.current) {
        return;
      }
      loadConfig(config);
      loadOnMountPerformed.current = true;
    }, [config, isConfigEmpty, loadConfig]);

    return (
      <HStack justify="space-between" align="stretch">
        <VStack align="stretch" justify="space-between" spacing={3}>
          <Heading as="h4" size="sm">
            Tips:
          </Heading>
          <UnorderedList spacing={1}>
            <ListItem>
              Add an Anthropic API key and the guides in the required fields.
            </ListItem>
            <ListItem>
              Input some natural text and press <kbd>Enter</kbd> to convert it
              to ES|QL.
            </ListItem>
            <ListItem>
              Press <kbd>{COMPLETION_KEY}</kbd> in the ES|QL area to complete
              the line.
            </ListItem>
            <ListItem>
              Optionally, connect your Elasticsearch instance to fetch data from
              it.
            </ListItem>
            <ListItem>
              <Highlight
                query={"blue"}
                styles={{ px: "2", py: "1", rounded: "md", bg: "blue.100" }}
              >
                Blue buttons are for LLM requests,
              </Highlight>{" "}
              <Highlight
                query={"teal"}
                styles={{ px: "2", py: "1", rounded: "md", bg: "teal.100" }}
              >
                teal for Elasticsearch.
              </Highlight>
            </ListItem>
          </UnorderedList>
          <Divider />
          <VStack align="stretch" justify="space-between">
            <HStack spacing={-0.5} align={"baseline"}>
              <Text>
                Button tooltips are {tooltipsShown ? " enabled" : " disabled"}:
              </Text>
              {!tooltipsShown && (
                <Button
                  variant="ghost"
                  colorScheme="green"
                  onClick={() => setTooltipsShown(true)}
                >
                  Enable
                </Button>
              )}
              {tooltipsShown && (
                <Button
                  variant="ghost"
                  colorScheme="green"
                  onClick={() => setTooltipsShown(false)}
                >
                  Disable
                </Button>
              )}
            </HStack>
            <HStack spacing={0.5} align={"baseline"}>
              <Text>Configuration can be stored in LocalStorage:</Text>
              <Button
                variant="ghost"
                colorScheme="green"
                onClick={() => storeConfig(collectConfig())}
              >
                Save
              </Button>
              {!isConfigEmpty && (
                <Button
                  variant="ghost"
                  colorScheme="green"
                  onClick={() => loadConfig(config)}
                >
                  Load
                </Button>
              )}
              {!isConfigEmpty && (
                <Button
                  variant="ghost"
                  colorScheme="red"
                  onClick={removeConfig}
                >
                  Clear
                </Button>
              )}
            </HStack>
          </VStack>
        </VStack>
        <VStack align="stretch" justify="space-between">
          <Link href="https://github.com/ilyannn/esql-composer" isExternal>
            <ExternalLinkIcon mx="3px" /> source
          </Link>
        </VStack>
      </HStack>
    );
  }
);

export default HowToUseArea;
