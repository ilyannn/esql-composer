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
import React, { ReactNode, useCallback } from "react";
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
  AvailableLLMConfigs,
} from "../services/llm/config";
import _ from "lodash";
import { CLAUDE_MODEL_LIST } from "../services/llm/config";
import { Config } from "ol/source/TileJSON";
import { assert } from "console";

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
          Direct Anthropic access allows us to use{" "}
          <Link isExternal href="https://www.anthropic.com/news/prompt-caching">
            <ExternalLinkIcon /> beta features
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
> = ({ config, updateConfig }) => {
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
    title: "Bedrock (under construction)",
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
    (prevProps, nextProps) => {
      return _.isEqual(
        prevProps.llmConfig[prevProps.type],
        nextProps.llmConfig[nextProps.type]
      );
    }
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
                (tab) => tab.id === llmConfig.selected
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
  }
);

export default LLMConfigurationArea;
