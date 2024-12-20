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
  Stack,
  StackDirection,
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
  LlamaServerLLMConfig,
  BedrockLLMConfig,
  FullLLMConfig,
  LLMChoice,
  ClaudeModelIndex,
  getAnthropicModelIndex,
  getBedrockModelIndex,
  OpenAILLMConfig,
} from "../services/llm/config";
import _, { set } from "lodash";
import { CLAUDE_MODEL_LIST } from "../services/llm/config";

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

interface ClaudeModelSelectionProps {
  selectedIndex: ClaudeModelIndex;
  setSelectedIndex: (value: ClaudeModelIndex) => void;
  children?: ReactNode;
}

const ClaudeModelSelection: React.FC<ClaudeModelSelectionProps> = React.memo(
  ({ selectedIndex, setSelectedIndex, children = null }) => {
    return (
      <FormControl as="fieldset" width="200px">
        <FormLabel as="legend">Claude 3.5 Model</FormLabel>
        <Box p={5} pt={0}>
          <Slider
            aria-label="Model Selection"
            onChange={(val) => setSelectedIndex(val as ClaudeModelIndex)}
            value={selectedIndex}
            min={0}
            max={CLAUDE_MODEL_LIST.length - 1}
            step={1}
          >
            {CLAUDE_MODEL_LIST.map((model, i) => (
              <SliderMark
                key={model.name}
                value={i}
                {...modelSliderlabelStyles}
              >
                {model.name}
              </SliderMark>
            ))}
            <SliderTrack bg="gray.200">
              <SliderFilledTrack bg="orange" />
            </SliderTrack>
            <SliderThumb boxSize={5 + 2 * selectedIndex} bg="red.50">
              <Text fontSize="sm">{"$".repeat(selectedIndex + 1)}</Text>
            </SliderThumb>
          </Slider>
        </Box>
        {children}
      </FormControl>
    );
  }
);

interface LlamaServerInputProps {
  llamaURL: string;
  setLlamaURL: (value: string) => void;
}

const LlamaServerInput: React.FC<LlamaServerInputProps> = React.memo(
  ({ llamaURL, setLlamaURL }) => {
    return (
      <FormControl flex={1}>
        <FormLabel>Server Endpoint</FormLabel>
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

interface ConfigInputProps {
  label: string;
  type: "password" | "text" | "url";

  autocompleteName: string;
  placeholder: string;

  value: string;
  setValue: (value: string) => void;

  isKnownToWork?: boolean | undefined;
  autoFocus?: boolean;
  children?: ReactNode;
}

const ConfigInput: React.FC<ConfigInputProps> = React.memo(
  ({
    autoFocus = false,
    autocompleteName,
    placeholder,
    label,
    value,
    setValue,
    isKnownToWork = undefined,
    type,
    children = null,
  }) => {
    return (
      <FormControl
        isInvalid={value.length !== 0 && isKnownToWork === false}
        flex={1}
      >
        <FormLabel>{label}</FormLabel>
        <InputGroup>
          <Input
            autoFocus={autoFocus}
            type={type}
            placeholder={placeholder}
            value={value}
            autoComplete={autocompleteName}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            errorBorderColor="red.300"
            flex={1}
          />
          {isKnownToWork === true ? (
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

const DividedStack: React.FC<{
  direction?: StackDirection;
  flex?: number;
  children: ReactNode;
}> = ({ direction = "row", flex = 1, children }) => (
  <Stack
    direction={direction}
    align="stretch"
    justify="flex-start"
    flex={flex}
    spacing={6}
    divider={<StackDivider borderColor="gray.200" />}
  >
    {children}
  </Stack>
);

const TAB_ORDER: LLMChoice[] = [
  "anthropic",
  "bedrock",
  "llamaServer",
  "openAI",
] as const;

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

    const updateBedrock = useCallback(
      (newConfig: Partial<BedrockLLMConfig>) =>
        setLLMConfig({
          ...llmConfig,
          bedrock: { ...llmConfig.bedrock, ...newConfig },
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

    const updateOpenAI = useCallback(
      (newConfig: Partial<OpenAILLMConfig>) =>
        setLLMConfig({
          ...llmConfig,
          openAI: { ...llmConfig.openAI, ...newConfig },
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
                <Tab>Bedrock</Tab>
                <Tab>Llama-server</Tab>
                <Tab>OpenAI</Tab>
              </TabList>
              <TabPanels
                borderColor={"gray.200"}
                borderWidth={1}
                backgroundColor={"white"}
              >
                <TabPanel>
                  <DividedStack>
                    <ClaudeModelSelection
                      selectedIndex={getAnthropicModelIndex(
                        llmConfig.anthropic.modelName
                      )}
                      setSelectedIndex={(index) =>
                        updateAnthropic({
                          modelName: CLAUDE_MODEL_LIST[index].anthropic,
                        })
                      }
                    >
                      <FormHelperText>
                        <Link
                          isExternal
                          href="https://www.anthropic.com/pricing#anthropic-api"
                        >
                          <ExternalLinkIcon mx="3px" />
                          Compare model pricing.
                        </Link>
                      </FormHelperText>
                    </ClaudeModelSelection>
                    <ConfigInput
                      label="Anthropic API Key"
                      type="password"
                      autoFocus={true}
                      autocompleteName="anthropic-api-key"
                      placeholder="Enter API key here"
                      value={llmConfig.anthropic.apiKey}
                      isKnownToWork={llmConfig.anthropic.isKnownToWork}
                      setValue={(apiKey: string) => {
                        updateAnthropic({
                          apiKey,
                          isKnownToWork: undefined,
                        });
                      }}
                    >
                      <FormHelperText>
                        Direct Anthropic access allows us to use{" "}
                        <Link
                          isExternal
                          href="https://www.anthropic.com/news/prompt-caching"
                        >
                          <ExternalLinkIcon /> beta features
                        </Link>
                        .
                      </FormHelperText>
                    </ConfigInput>
                  </DividedStack>
                </TabPanel>
                <TabPanel>
                  <DividedStack>
                    <DividedStack direction={"column"} flex={0}>
                      <ConfigInput
                        label="AWS Region"
                        type="text"
                        autocompleteName="awsRegion"
                        placeholder="Enter AWS_REGION value here"
                        value={llmConfig.bedrock.region}
                        setValue={(region: string) => {
                          updateBedrock({
                            region,
                            isKnownToWork: undefined,
                          });
                        }}
                      />
                      <ClaudeModelSelection
                        selectedIndex={getBedrockModelIndex(
                          llmConfig.bedrock.modelName
                        )}
                        setSelectedIndex={(index) =>
                          updateBedrock({
                            modelName: CLAUDE_MODEL_LIST[index].bedrock,
                          })
                        }
                      />
                    </DividedStack>
                    <DividedStack direction={"column"}>
                      <ConfigInput
                        label="AWS Access Key ID"
                        type="text"
                        autocompleteName="awsAccessKey"
                        placeholder="Enter AWS_ACCESS_KEY_ID value here"
                        value={llmConfig.bedrock.accessKeyId}
                        setValue={(keyID: string) => {
                          updateBedrock({
                            accessKeyId: keyID,
                            isKnownToWork: undefined,
                          });
                        }}
                      />
                      <ConfigInput
                        label="AWS Secret Access Key"
                        type="password"
                        autocompleteName="awsSecretKey"
                        placeholder="Enter AWS_SECRET_ACCESS_KEY value here"
                        value={llmConfig.bedrock.secretAccessKey}
                        setValue={(keySecret: string) => {
                          updateBedrock({
                            secretAccessKey: keySecret,
                            isKnownToWork: undefined,
                          });
                        }}
                        isKnownToWork={llmConfig.bedrock.isKnownToWork}
                      ></ConfigInput>
                    </DividedStack>
                  </DividedStack>
                </TabPanel>
                <TabPanel>
                  <DividedStack>
                    <LlamaServerInput
                      llamaURL={llmConfig.llamaServer.apiURL}
                      setLlamaURL={(apiURL: string) =>
                        updateLlamaServer({
                          apiURL,
                          isKnownToWork: undefined,
                        })
                      }
                    />
                    <ConfigInput
                      label="API Key"
                      type="password"
                      autocompleteName="llama-api-key"
                      placeholder="Not set up by default"
                      value={llmConfig.llamaServer.apiKey}
                      isKnownToWork={llmConfig.llamaServer.isKnownToWork}
                      setValue={(apiKey: string) => {
                        updateLlamaServer({
                          apiKey,
                          isKnownToWork: undefined,
                        });
                      }}
                    >
                      <FormHelperText>
                        Only required if the server was started with the{" "}
                        <Code>--api-key</Code> flag.
                      </FormHelperText>
                    </ConfigInput>
                  </DividedStack>
                </TabPanel>
                <TabPanel>
                  <Text>OpenAI is not supported yet.</Text>
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
