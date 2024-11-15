import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Button,
  Heading,
  Highlight,
  HStack,
  Link,
  ListItem,
  OrderedList,
  Text,
  UnorderedList,
  VStack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerFooter,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";

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
    const { isOpen, onOpen, onClose } = useDisclosure();

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
      <>
        <Button variant="ghost" colorScheme="green" onClick={onOpen}>
          Help & Settings ➔
        </Button>
        <Drawer isOpen={isOpen} placement="right" size="md" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Help & Settings</DrawerHeader>

            <DrawerBody>
              <HStack justify="space-between" align="stretch">
                <VStack align="stretch" justify="space-between" spacing={3}>
                  <Heading as="h4" size="sm" mt={2}>
                    Basic usage:
                  </Heading>
                  <OrderedList spacing={1} ml="2em">
                    <ListItem>
                      Add an Anthropic API key in the LLM configuration section.
                    </ListItem>
                    <ListItem>
                      Optionally, connect your ES instance to:
                      <UnorderedList spacing={1.6} ml="1.8em">
                        <ListItem> Generate a schema for your index.</ListItem>
                        <ListItem> Show ES|QL query results.</ListItem>
                      </UnorderedList>
                    </ListItem>
                    <ListItem>
                      Work on your query:
                      <UnorderedList spacing={1.6} ml="1.8em">
                        <ListItem>
                          Prompt LLM in the natural text field.
                        </ListItem>
                        <ListItem>
                          Add new natural text lines in the ES|QL field.
                        </ListItem>
                        <ListItem>
                          Use the visual composer to add ES|QL functions.
                        </ListItem>
                      </UnorderedList>
                    </ListItem>
                  </OrderedList>
                  <Heading as="h4" size="sm" mt={3} mb={0}>
                    Tips:
                  </Heading>
                  <UnorderedList spacing={2} ml="2em">
                    <ListItem>
                      <Highlight
                        query={"blue"}
                        styles={{
                          px: "2",
                          py: "1",
                          rounded: "md",
                          bg: "blue.100",
                        }}
                      >
                        Blue color is for LLM stuff,
                      </Highlight>{" "}
                      <Highlight
                        query={"teal"}
                        styles={{
                          px: "2",
                          py: "1",
                          rounded: "md",
                          bg: "teal.100",
                        }}
                      >
                        teal for Elasticsearch.
                      </Highlight>
                    </ListItem>
                  </UnorderedList>
                  <Heading as="h4" size="sm" mt={3.5} mb={-2}>
                    Settings:
                  </Heading>
                  <VStack align="stretch" justify="space-between">
                    <UnorderedList spacing={-2} ml="2em">
                      <ListItem>
                        <HStack spacing={-0.5} align={"baseline"}>
                          <Text>
                            Button tooltips are{" "}
                            {tooltipsShown ? " enabled" : " disabled"}:
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
                      </ListItem>
                      <ListItem>
                        <HStack spacing={0.5} align={"baseline"}>
                          <Text>
                            Store config in your browser:
                          </Text>
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
                  </VStack>
                </VStack>
                <VStack align="stretch" justify="space-between"></VStack>
              </HStack>
            </DrawerBody>

            <DrawerFooter>
              <Link href="https://github.com/ilyannn/esql-composer" isExternal>
                <ExternalLinkIcon mx="3px" /> source
              </Link>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
);

export default HowToUseArea;
