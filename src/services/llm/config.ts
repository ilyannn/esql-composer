/**
 * A model that is available through the Anthropic API or Bedrock.
 */
interface ClaudeModel {
  name: string;
  anthropic: string;
  bedrock: string;
}

/**
 * List of Anthropic models available through the Anthropic API or Bedrock.
 * Sorted from least powerful (and costly) to most powerful.
 */
export const CLAUDE_MODEL_LIST: ClaudeModel[] = [
  {
    name: "Haiku",
    anthropic: "claude-3-5-haiku-latest",
    bedrock: "anthropic.claude-3-5-haiku-20241022-v1:0",
  },
  {
    name: "Sonnet",
    anthropic: "claude-3-5-sonnet-latest",
    bedrock: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  },
  //  { name: "Opus", anthropic: "claude-3-5-opus-latest" } -- not available yet
] as const;

export type ClaudeModelIndex = 0 | 1;
export type AnthropicModelName =
  (typeof CLAUDE_MODEL_LIST)[ClaudeModelIndex]["anthropic"];
export type BedrockModelName =
  (typeof CLAUDE_MODEL_LIST)[ClaudeModelIndex]["bedrock"];

/**
 * Retrieves the index of the specified Anthropic model name from the CLAUDE_MODEL_LIST.
 * If the model name is not found, it returns 0.
 *
 * @param modelName - The name of the Anthropic model to find.
 * @returns The index of the specified model name in the CLAUDE_MODEL_LIST, or 0 if not found.
 */
export const getAnthropicModelIndex = (
  modelName: AnthropicModelName,
): ClaudeModelIndex =>
  Math.max(
    0,
    CLAUDE_MODEL_LIST.findIndex((model) => model.anthropic === modelName),
  ) as ClaudeModelIndex;

/**
 * Retrieves the index of the specified Bedrock model name from the CLAUDE_MODEL_LIST.
 * If the model name is not found, it returns 0.
 * @param modelName - The name of the Bedrock model to find.
 * @returns The index of the specified model name in the CLAUDE_MODEL_LIST, or 0 if not found.
 */
export const getBedrockModelIndex = (
  modelName: BedrockModelName,
): ClaudeModelIndex =>
  Math.max(
    0,
    CLAUDE_MODEL_LIST.findIndex((model) => model.bedrock === modelName),
  ) as ClaudeModelIndex;

interface BaseLLMConfig {
  readonly type: string;
  isKnownToWork?: boolean | undefined;
}

export interface AnthropicLLMConfig extends BaseLLMConfig {
  readonly type: "anthropic";
  apiKey: string;
  modelName: AnthropicModelName;
}

export interface BedrockLLMConfig extends BaseLLMConfig {
  readonly type: "bedrock";
  region: string;
  modelName: BedrockModelName;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface LlamaServerLLMConfig extends BaseLLMConfig {
  readonly type: "llamaServer";
  apiURL: string;
  apiKey: string;
}

export interface OpenAILLMConfig extends BaseLLMConfig {
  readonly type: "openAI";
  apiURL: string;
  apiKey: string;
}

export type AvailableLLMConfigs =
  | AnthropicLLMConfig
  | BedrockLLMConfig
  | LlamaServerLLMConfig
  | OpenAILLMConfig;

/**
 * List of LLM providers.
 */
export type LLMProvider = AvailableLLMConfigs["type"];
export type FullLLMConfig = Record<LLMProvider, AvailableLLMConfigs> & {
  [provider in LLMProvider]: { type: provider };
} & {
  selected: LLMProvider;
};

/**
 * Default LLM config for all LLMs.
 */
export const defaultLLMConfig = {
  selected: "anthropic",
  anthropic: {
    type: "anthropic",
    apiKey: "",
    modelName: CLAUDE_MODEL_LIST[0].anthropic,
  },
  bedrock: {
    type: "bedrock",
    region: "us-east-1",
    accessKeyId: "",
    secretAccessKey: "",
    modelName: CLAUDE_MODEL_LIST[0].bedrock,
  },
  llamaServer: {
    type: "llamaServer",
    apiURL: "http://localhost:8080",
    apiKey: "",
  },
  openAI: {
    type: "openAI",
    apiURL: "https://api.openai.com/v1",
    apiKey: "",
  },
} as const satisfies FullLLMConfig;

/**
 * Checks if the LLM config is sufficient for the selected LLM.
 * @param config - The LLM config to check.
 * @returns True if the config is sufficient, false otherwise.
 */
export const isLLMConfigSufficent = (config: FullLLMConfig): boolean => {
  switch (config.selected) {
    case "anthropic":
      return config.anthropic.apiKey.length > 0;

    case "bedrock":
      return (
        config.bedrock.region.length > 0 &&
        config.bedrock.accessKeyId.length > 0 &&
        config.bedrock.secretAccessKey.length > 0
      );

    case "llamaServer":
      return config.llamaServer.apiURL.length > 0;

    case "openAI":
      return config.openAI.apiURL.length > 0 && config.openAI.apiKey.length > 0;
  }
};
