import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Button,
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
        <UnorderedList>
          <ListItem>
            Add an Anthropic API key and the reference materials in the fields.
          </ListItem>
          <ListItem>
            Input some natural text and press <kbd>Enter</kbd> to convert it to
            ES|QL.
          </ListItem>
          <ListItem>
            Press <kbd>{COMPLETION_KEY}</kbd> in the ES|QL area to show a
            completion, press again to insert.
          </ListItem>
          <ListItem>
            Blue buttons perform Anthropic API requests (unfilled buttons = gratis, filled = paid).
          </ListItem>
          <ListItem>
            <HStack spacing={-0.5} align={"baseline"}>
            <Text>Button tooltips:</Text>
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
          </ListItem>
          <ListItem>
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
          </ListItem>
        </UnorderedList>
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
