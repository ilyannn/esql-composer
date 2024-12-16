import { CheckIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Code,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  StackDivider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import React, { ReactNode, useCallback, useMemo } from "react";
import SpinningButton from "./components/SpinningButton";
import {
  AnthropicLLMConfig,
  AnthropicModelName,
  LlamaServerLLMConfig,
  FullLLMConfig,
  LLMChoice,
} from "../services/llm/config";
import _, { set } from "lodash";
import { ANTHROPIC_MODEL_LIST } from "../services/llm/config";

interface LLMConfigurationAreaProps {
  llmConfig: FullLLMConfig;
  setLLMConfig: (value: FullLLMConfig) => void;
  tooltipsShown: boolean;
  isAbleToTest: boolean;
  performTest: () => Promise<void>;
}

const modelSliderlabelStyles = {
  mt: "3",
  ml: "-3",
  fontSize: "sm",
};

interface AnthropicModelSelectionProps {
  modelName: AnthropicModelName;
  setModelName: (value: AnthropicModelName) => void;
}

const AnthropicModelSelection: React.FC<AnthropicModelSelectionProps> =
  React.memo(({ modelName, setModelName }) => {
    const indexModelName = ANTHROPIC_MODEL_LIST.findIndex(
      ([_, name]) => name === modelName
    );
    const modelSelected = indexModelName === -1 ? 0 : indexModelName;
    const setModelSelected = useCallback((val: number) => {
      setModelName(ANTHROPIC_MODEL_LIST[val][1]);
    }, []);

    return (
      <FormControl as="fieldset" width="200px">
        <FormLabel as="legend">Claude 3.5 Model</FormLabel>
        <Box p={5} pt={0}>
          <Slider
            aria-label="Model Selection"
            onChange={(val) => setModelSelected(val)}
            value={modelSelected}
            min={0}
            max={ANTHROPIC_MODEL_LIST.length - 1}
            step={1}
          >
            {ANTHROPIC_MODEL_LIST.map(([humanTitle, name], i) => (
              <SliderMark key={name} value={i} {...modelSliderlabelStyles}>
                {humanTitle}
              </SliderMark>
            ))}
            <SliderTrack bg="gray.200">
              <SliderFilledTrack bg="orange" />
            </SliderTrack>
            <SliderThumb boxSize={5 + 2 * modelSelected} bg="red.50">
              <Text fontSize="sm">{"$".repeat(modelSelected + 1)}</Text>
            </SliderThumb>
          </Slider>
        </Box>
        <FormHelperText>
          <Link
            isExternal
            href="https://www.anthropic.com/pricing#anthropic-api"
          >
            <ExternalLinkIcon mx="3px" />
            Compare model pricing.
          </Link>
        </FormHelperText>
      </FormControl>
    );
  });

interface LlamaServerInputProps {
  llamaURL: string;
  setLlamaURL: (value: string) => void;
}

const LlamaServerInput: React.FC<LlamaServerInputProps> = React.memo(
  ({ llamaURL, setLlamaURL }) => {
    return (
      <FormControl flex={1}>
        <FormLabel>Server endpoint</FormLabel>
        <InputGroup>
          <Input
            autoFocus={true}
            type="url"
            placeholder="Enter URL here"
            value={llamaURL}
            autoComplete="llama-api-url"
            onChange={(e) => {
              setLlamaURL(e.target.value);
            }}
            errorBorderColor="red.300"
            flex={1}
          />
        </InputGroup>
        <FormHelperText>
          See <ExternalLinkIcon />{" "}
          <Link
            isExternal
            href="https://github.com/ggerganov/llama.cpp/blob/master/examples/server/README.md"
          >
            project documentation
          </Link>
          .
        </FormHelperText>
      </FormControl>
    );
  }
);

interface APIKeyInputProps {
  autoFocus: boolean;
  autocompleteName: string;
  placeholder: string;
  apiKey: string;
  apiKeyWorks: boolean | undefined;
  setApiKey: (value: string) => void;
  children: ReactNode;
}

const APIKeyInput: React.FC<APIKeyInputProps> = React.memo(
  ({
    autoFocus,
    autocompleteName,
    placeholder,
    apiKey,
    apiKeyWorks,
    setApiKey,
    children,
  }) => {
    return (
      <FormControl
        isInvalid={apiKey.length !== 0 && apiKeyWorks === false}
        flex={1}
      >
        <FormLabel>Authentication</FormLabel>
        <InputGroup>
          <Input
            autoFocus={autoFocus}
            type="password"
            placeholder={placeholder}
            value={apiKey}
            autoComplete={autocompleteName}
            onChange={(e) => {
              setApiKey(e.target.value);
            }}
            errorBorderColor="red.300"
            flex={1}
          />
          {apiKeyWorks === true ? (
            <InputRightElement>
              <CheckIcon color="green.300" />
            </InputRightElement>
          ) : null}
        </InputGroup>
        {children}
      </FormControl>
    );
  }
);

const DividedStack: React.FC<{ children: ReactNode }> = ({ children }) => (
  <HStack
    align="stretch"
    justify="space-between"
    spacing={6}
    divider={<StackDivider borderColor="gray.200" />}
  >
    {children}
  </HStack>
);

const TAB_ORDER: LLMChoice[] = ["anthropic", "llamaServer"] as const;

const LLMConfigurationArea: React.FC<LLMConfigurationAreaProps> = React.memo(
  ({ llmConfig, setLLMConfig, tooltipsShown, isAbleToTest, performTest }) => {
    const updateAnthropic = useCallback(
      (newConfig: Partial<AnthropicLLMConfig>) =>
        setLLMConfig({
          ...llmConfig,
          anthropic: { ...llmConfig.anthropic, ...newConfig },
        }),
      [llmConfig]
    );

    const updateLlamaServer = useCallback(
      (newConfig: Partial<LlamaServerLLMConfig>) =>
        setLLMConfig({
          ...llmConfig,
          llamaServer: { ...llmConfig.llamaServer, ...newConfig },
        }),
      [llmConfig]
    );

    return (
      <VStack align="stretch" justify="space-between" spacing={6}>
        <form onSubmit={(e) => e.preventDefault()}>
          <DividedStack>
            <Tabs
              variant="enclosed-colored"
              flex={1}
              index={TAB_ORDER.indexOf(llmConfig.selected)}
              onChange={(index) =>
                setLLMConfig({
                  ...llmConfig,
                  selected: TAB_ORDER[index],
                })
              }
            >
              <TabList>
                <Tab>Anthropic</Tab>
                <Tab>Llama-server</Tab>
              </TabList>
              <TabPanels
                borderColor={"gray.200"}
                borderWidth={1}
                backgroundColor={"white"}
              >
                <TabPanel>
                  <DividedStack>
                    <AnthropicModelSelection
                      modelName={llmConfig.anthropic.modelName}
                      setModelName={(modelName: AnthropicModelName) =>
                        updateAnthropic({ modelName })
                      }
                    />
                    <APIKeyInput
                      autoFocus={true}
                      autocompleteName="anthropic-api-key"
                      placeholder="Enter Anthropic API key here"
                      apiKey={llmConfig.anthropic.apiKey}
                      apiKeyWorks={llmConfig.anthropic.isKnownToWork}
                      setApiKey={(apiKey: string) => {
                        updateAnthropic({ apiKey, isKnownToWork: undefined });
                      }}
                    >
                      <FormHelperText>
                        Since we use{" "}
                        <Link
                          isExternal
                          href="https://www.anthropic.com/news/prompt-caching"
                        >
                          <ExternalLinkIcon /> beta features
                        </Link>
                        , only direct access is supported.
                      </FormHelperText>
                    </APIKeyInput>
                  </DividedStack>
                </TabPanel>
                <TabPanel>
                  <DividedStack>
                    <LlamaServerInput
                      llamaURL={llmConfig.llamaServer.serverURL}
                      setLlamaURL={(serverURL: string) =>
                        updateLlamaServer({
                          serverURL,
                          isKnownToWork: undefined,
                        })
                      }
                    />
                    <APIKeyInput
                      autoFocus={false}
                      autocompleteName="llama-api-key"
                      placeholder="Enter API key here, if any"
                      apiKey={llmConfig.llamaServer.apiKey}
                      apiKeyWorks={llmConfig.llamaServer.isKnownToWork}
                      setApiKey={(apiKey: string) => {
                        updateLlamaServer({ apiKey, isKnownToWork: undefined });
                      }}
                    >
                      <FormHelperText>
                        You can set up an API key with the{" "}
                        <Code>--api-key</Code> flag.
                      </FormHelperText>
                    </APIKeyInput>
                  </DividedStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
            <Tooltip
              isDisabled={!tooltipsShown}
              label="Perform a test request to the API"
            >
              <SpinningButton
                type="submit"
                disabled={!isAbleToTest}
                spinningAction={performTest}
              >
                Test
              </SpinningButton>
            </Tooltip>
          </DividedStack>
        </form>
      </VStack>
    );
  }
);

export default LLMConfigurationArea;
