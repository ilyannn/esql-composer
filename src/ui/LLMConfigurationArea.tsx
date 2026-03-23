import { CheckIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Code,
  FormControl,
  FormHelperText,
  FormLabel,
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
  useToast,
} from "@chakra-ui/react";
import React, { ReactNode } from "react";
import SpinningButton from "./components/SpinningButton";
import {
  AnthropicLLMConfig,
  LlamaServerLLMConfig,
  BedrockLLMConfig,
  FullLLMConfig,
  LLMProvider,
  ClaudeModelIndex,
  getAnthropicModelIndex,
  getBedrockModelIndex,
  OpenAILLMConfig,
} from "../services/llm/config";
import _ from "lodash";
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
  fontSize: "sm",
  transform: "translateX(-50%)",
  whiteSpace: "nowrap",
};

interface ClaudeModelSelectionProps {
  selectedIndex: ClaudeModelIndex;
  setSelectedIndex: (value: ClaudeModelIndex) => void;
  children?: ReactNode;
}

const ClaudeModelSelection: React.FC<ClaudeModelSelectionProps> = React.memo(
  ({ selectedIndex, setSelectedIndex, children = null }) => {
    return (
      <FormControl as="fieldset" width="250px">
        <FormLabel as="legend">Claude Model</FormLabel>
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
  },
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
  },
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
  allowFileDrop?: boolean;
  children?: ReactNode;
}

export const getDroppedSecretValue = (text: string): string => {
  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmedText);
    if (typeof parsed === "string") {
      return parsed.trim();
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      for (const key of ["apiKey", "key", "token", "encoded"]) {
        if (typeof record[key] === "string") {
          return record[key].trim();
        }
      }
    }
  } catch (_error) {
    return trimmedText;
  }

  return trimmedText;
};

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
    allowFileDrop = false,
    children = null,
  }) => {
    const toast = useToast();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragOver = React.useCallback(
      (event: React.DragEvent) => {
        if (!allowFileDrop) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        setIsDragging(true);
      },
      [allowFileDrop],
    );

    const handleDrop = React.useCallback(
      (event: React.DragEvent) => {
        if (!allowFileDrop) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        const droppedFile = event.dataTransfer.files.item(0);
        if (!droppedFile) {
          return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const text = String(loadEvent.target?.result ?? "");
          const droppedValue = getDroppedSecretValue(text);

          if (droppedValue.length === 0) {
            toast({
              title: `${label} Drag & Drop`,
              description: "The dropped file did not contain a usable key.",
              status: "error",
              duration: 4000,
              isClosable: true,
            });
            return;
          }

          setValue(droppedValue);
          toast({
            title: `${label} Drag & Drop`,
            description: `Loaded ${label.toLowerCase()} from file.`,
            status: "success",
            duration: 2500,
            isClosable: true,
          });
        };
        reader.onerror = () => {
          toast({
            title: `${label} Drag & Drop`,
            description: "Failed to read the dropped file.",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        };
        reader.readAsText(droppedFile);
      },
      [allowFileDrop, label, setValue, toast],
    );

    return (
      <FormControl
        isInvalid={value.length !== 0 && isKnownToWork === false}
        flex={1}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnter={() => allowFileDrop && setIsDragging(true)}
        onDragLeave={() => allowFileDrop && setIsDragging(false)}
      >
        <FormLabel>{label}</FormLabel>
        <InputGroup>
          <Input
            ref={inputRef}
            autoFocus={autoFocus}
            name={autocompleteName}
            type={type}
            placeholder={placeholder}
            value={value}
            autoComplete={autocompleteName}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onInput={(e) => {
              setValue(e.currentTarget.value);
            }}
            onBlur={(e) => {
              setValue(e.currentTarget.value);
            }}
            style={
              isDragging
                ? {
                    border: "1px dashed blue",
                    color: "blue",
                    backgroundColor: "#ebf8ff",
                    cursor: "copy",
                  }
                : {}
            }
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
  },
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

interface ConfigurationTabProps<T> {
  config: T;
  updateConfig: (value: Partial<T>) => void;
}

const AnthropicConfigurationTab: React.FC<
  ConfigurationTabProps<AnthropicLLMConfig>
> = ({ config, updateConfig }) => {
  return (
    <DividedStack>
      <ClaudeModelSelection
        selectedIndex={getAnthropicModelIndex(config.modelName)}
        setSelectedIndex={(index) =>
          updateConfig({
            modelName: CLAUDE_MODEL_LIST[index].anthropic,
          })
        }
      >
        <FormHelperText>
          <Link
            isExternal
            href="https://www.anthropic.com/pricing#api"
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
        placeholder="Enter API key here or drop a file"
        value={config.apiKey}
        isKnownToWork={config.isKnownToWork}
        allowFileDrop={true}
        setValue={(apiKey: string) => {
          updateConfig({
            apiKey,
            isKnownToWork: undefined,
          });
        }}
      >
        <FormHelperText>
          Direct Anthropic access allows us to use{" "}
          <Link isExternal href="https://claude.com/blog/prompt-caching">
            <ExternalLinkIcon /> prompt caching
          </Link>
          .
        </FormHelperText>
      </ConfigInput>
    </DividedStack>
  );
};

const BedrockConfigurationTab: React.FC<
  ConfigurationTabProps<BedrockLLMConfig>
> = ({ config, updateConfig }) => {
  return (
    <DividedStack>
      <DividedStack direction={"column"} flex={0}>
        <ConfigInput
          label="AWS Region"
          type="text"
          autocompleteName="awsRegion"
          placeholder="Enter AWS_REGION value here"
          value={config.region}
          setValue={(region: string) => {
            updateConfig({
              region,
              isKnownToWork: undefined,
            });
          }}
        />
        <ClaudeModelSelection
          selectedIndex={getBedrockModelIndex(config.modelName)}
          setSelectedIndex={(index) =>
            updateConfig({
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
          value={config.accessKeyId}
          setValue={(keyID: string) =>
            updateConfig({
              accessKeyId: keyID,
              isKnownToWork: undefined,
            })
          }
        />
        <ConfigInput
          label="AWS Secret Access Key"
          type="password"
          autocompleteName="awsSecretKey"
          placeholder="Enter AWS_SECRET_ACCESS_KEY value here"
          value={config.secretAccessKey}
          setValue={(keySecret: string) =>
            updateConfig({
              secretAccessKey: keySecret,
              isKnownToWork: undefined,
            })
          }
          isKnownToWork={config.isKnownToWork}
        ></ConfigInput>
      </DividedStack>
    </DividedStack>
  );
};

const LlamaServerConfigurationTab: React.FC<
  ConfigurationTabProps<LlamaServerLLMConfig>
> = ({ config, updateConfig }) => {
  return (
    <DividedStack>
      <LlamaServerInput
        llamaURL={config.apiURL}
        setLlamaURL={(apiURL: string) =>
          updateConfig({
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
        value={config.apiKey}
        isKnownToWork={config.isKnownToWork}
        setValue={(apiKey: string) => {
          updateConfig({
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
  );
};

const OpenAIConfigurationTab: React.FC<
  ConfigurationTabProps<OpenAILLMConfig>
> = ({ config: _config, updateConfig: _updateConfig }) => {
  return <Text>OpenAI is not supported yet.</Text>;
};

interface TabConfig {
  id: LLMProvider;
  title: string;
}

const TAB_CONFIG: TabConfig[] = [
  { id: "anthropic", title: "Anthropic" },
  {
    id: "bedrock",
    title: "Bedrock (beta)",
  },
  {
    id: "llamaServer",
    title: "Llama-server (under construction)",
  },
  //  { id: "openAI", title: "OpenAI (under construction)" },
] as const;

interface AdaptedConfigurationTabProps {
  type: LLMProvider;
  llmConfig: FullLLMConfig;
  setLLMConfig: (value: FullLLMConfig) => void;
}

const AdaptedConfigurationTab: React.FC<AdaptedConfigurationTabProps> =
  React.memo(
    ({ type, llmConfig, setLLMConfig }) => {
      // Can't figure out how to make this work without repeating the same code,
      // but at least it's type safe
      switch (type) {
        case "anthropic":
          return (
            <AnthropicConfigurationTab
              config={llmConfig.anthropic}
              updateConfig={(value) =>
                setLLMConfig({
                  ...llmConfig,
                  anthropic: {
                    ...llmConfig.anthropic,
                    ...value,
                  },
                })
              }
            />
          );
        case "bedrock":
          return (
            <BedrockConfigurationTab
              config={llmConfig.bedrock}
              updateConfig={(value) =>
                setLLMConfig({
                  ...llmConfig,
                  bedrock: {
                    ...llmConfig.bedrock,
                    ...value,
                  },
                })
              }
            />
          );
        case "llamaServer":
          return (
            <LlamaServerConfigurationTab
              config={llmConfig.llamaServer}
              updateConfig={(value) =>
                setLLMConfig({
                  ...llmConfig,
                  llamaServer: {
                    ...llmConfig.llamaServer,
                    ...value,
                  },
                })
              }
            />
          );
        case "openAI":
          return (
            <OpenAIConfigurationTab
              config={llmConfig.openAI}
              updateConfig={(value) =>
                setLLMConfig({
                  ...llmConfig,
                  openAI: {
                    ...llmConfig.openAI,
                    ...value,
                  },
                })
              }
            />
          );
      }
    },
    (prevProps, nextProps) =>
      (prevProps.llmConfig.selected === prevProps.type) ===
        (nextProps.llmConfig.selected === nextProps.type) &&
      _.isEqual(
        prevProps.llmConfig[prevProps.type],
        nextProps.llmConfig[nextProps.type],
      ),
  );

const LLMConfigurationArea: React.FC<LLMConfigurationAreaProps> = React.memo(
  ({ llmConfig, setLLMConfig, tooltipsShown, isAbleToTest, performTest }) => {
    return (
      <VStack align="stretch" justify="space-between" spacing={6}>
        <form onSubmit={(e) => e.preventDefault()}>
          <DividedStack>
            <Tabs
              variant="enclosed-colored"
              flex={1}
              index={TAB_CONFIG.findIndex(
                (tab) => tab.id === llmConfig.selected,
              )}
              onChange={(index) =>
                setLLMConfig({
                  ...llmConfig,
                  selected: TAB_CONFIG[index].id,
                })
              }
            >
              <TabList>
                {TAB_CONFIG.map((tab) => (
                  <Tab key={tab.id}>{tab.title}</Tab>
                ))}
              </TabList>
              <TabPanels
                borderColor={"gray.200"}
                borderWidth={1}
                backgroundColor={"white"}
              >
                {TAB_CONFIG.map((tab) => (
                  <TabPanel key={tab.id}>
                    <AdaptedConfigurationTab
                      type={tab.id}
                      llmConfig={llmConfig}
                      setLLMConfig={setLLMConfig}
                    />
                  </TabPanel>
                ))}
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
  },
);

export default LLMConfigurationArea;
