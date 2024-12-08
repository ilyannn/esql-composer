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
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import TracingCheckbox from "../services/tracing/TracingCheckbox";
import { TracingOption } from "../services/tracing/types";

const CONFIG_KEY = "config";

interface HowToUseAreaProps {
  tooltipsShown: boolean;
  setTooltipsShown: (value: boolean) => void;

  llmTracingOption: TracingOption;
  setLLMTracingOption: (option: TracingOption) => void;
  esTracingOption: TracingOption;
  setESTracingOption: (option: TracingOption) => void;

  collectConfig: () => Config;
  loadConfig: (config: Config) => void;
}

export interface Config {
  [key: string]: any;
}

const HowToUseArea: React.FC<HowToUseAreaProps> = React.memo(
  ({
    tooltipsShown,
    setTooltipsShown,
    collectConfig,
    loadConfig,
    llmTracingOption,
    setLLMTracingOption,
    esTracingOption,
    setESTracingOption,
  }) => {
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
                      <Highlight
                        query={"LLM"}
                        styles={{
                          px: "2",
                          py: "1",
                          rounded: "md",
                          bg: "orange.100",
                        }}
                      >
                        Add an Anthropic API key in the LLM section.
                      </Highlight>
                    </ListItem>
                    <ListItem>
                      <Highlight
                        query={"Elasticsearch"}
                        styles={{
                          px: "2",
                          py: "1",
                          rounded: "md",
                          bg: "teal.100",
                        }}
                      >
                        Connect your Elasticsearch instance.
                      </Highlight>
                    </ListItem>
                    <ListItem>
                      <Highlight
                        query={"schema"}
                        styles={{
                          px: "2",
                          py: "1",
                          rounded: "md",
                          bg: "purple.100",
                        }}
                      >
                        Generate from your index or use a demo schema.
                      </Highlight>
                    </ListItem>
                    <ListItem>
                      Work on your query:
                      <UnorderedList spacing={1.6} ml="1.8em">
                        <ListItem>
                          Prompt LLM in the natural text field.
                        </ListItem>
                        <ListItem>Edit in the ES|QL field.</ListItem>
                        <ListItem>Display data from Elasticsearch.</ListItem>
                        <ListItem>
                          Use the visual composer to add ES|QL commands.
                        </ListItem>
                      </UnorderedList>
                    </ListItem>
                  </OrderedList>
                  {/* <Heading as="h4" size="sm" mt={3} mb={0}>
                    Tips:
                  </Heading>
                  <UnorderedList spacing={2} ml="2em">
                    <ListItem>
                      <Highlight
                        query={"orange"}
                        styles={{
                          px: "2",
                          py: "1",
                          rounded: "md",
                          bg: "orange.100",
                        }}
                      >
                        Orange color is for LLM stuff,
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
                  </UnorderedList> */}
                  <Heading as="h4" size="sm" mt={3.5} mb={-1}>
                    Observability:
                  </Heading>
                  <Text>Write traces to your Elasticsearch instance:</Text>
                  <VStack align="stretch" justify="space-between" ml={"2em"}>
                    <CheckboxGroup>
                      <TracingCheckbox
                        option={llmTracingOption}
                        setOption={setLLMTracingOption}
                      >
                        LLM calls
                      </TracingCheckbox>
                      <TracingCheckbox
                        option={esTracingOption}
                        setOption={setESTracingOption}
                      >
                        ES queries
                      </TracingCheckbox>
                    </CheckboxGroup>
                  </VStack>

                  <Heading as="h4" size="sm" mt={3.5} mb={-2}>
                    UX Settings:
                  </Heading>
                  <VStack align="stretch" justify="space-between">
                    <HStack spacing={-0.5} mb={-3} align={"baseline"}>
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
                    <HStack spacing={0.5} align={"baseline"}>
                      <Text>Store config in your browser:</Text>
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
