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
    name: "Haiku 4.5",
    anthropic: "claude-haiku-4-5",
    bedrock: "anthropic.claude-haiku-4-5-20251001-v1:0",
  },
  {
    name: "Sonnet 4.6",
    anthropic: "claude-sonnet-4-6",
    bedrock: "anthropic.claude-sonnet-4-6",
  },
  {
    name: "Opus 4.6",
    anthropic: "claude-opus-4-6",
    bedrock: "anthropic.claude-opus-4-6-v1",
  },
] as const;

export type ClaudeModelIndex = 0 | 1 | 2;
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

const hasNonEmptyValue = (value: string): boolean => value.trim().length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLLMProvider = (value: unknown): value is LLMProvider =>
  value === "anthropic" ||
  value === "bedrock" ||
  value === "llamaServer" ||
  value === "openAI";

const mergeProviderConfig = <T extends AvailableLLMConfigs>(
  defaults: T,
  overrides: unknown,
): T => {
  if (!isRecord(overrides)) {
    return { ...defaults };
  }

  return {
    ...defaults,
    ...overrides,
    type: defaults.type,
  };
};

export const mergeLLMConfig = (overrides: unknown): FullLLMConfig => {
  const overrideRecord = isRecord(overrides) ? overrides : {};

  return {
    selected: isLLMProvider(overrideRecord["selected"])
      ? overrideRecord["selected"]
      : defaultLLMConfig.selected,
    anthropic: mergeProviderConfig(
      defaultLLMConfig.anthropic,
      overrideRecord["anthropic"],
    ),
    bedrock: mergeProviderConfig(
      defaultLLMConfig.bedrock,
      overrideRecord["bedrock"],
    ),
    llamaServer: mergeProviderConfig(
      defaultLLMConfig.llamaServer,
      overrideRecord["llamaServer"],
    ),
    openAI: mergeProviderConfig(defaultLLMConfig.openAI, overrideRecord["openAI"]),
  };
};

/**
 * Checks if the LLM config is sufficient for the selected LLM.
 * @param config - The LLM config to check.
 * @returns True if the config is sufficient, false otherwise.
 */
export const isLLMConfigSufficent = (config: FullLLMConfig): boolean => {
  switch (config.selected) {
    case "anthropic":
      return hasNonEmptyValue(config.anthropic.apiKey);

    case "bedrock":
      return (
        hasNonEmptyValue(config.bedrock.region) &&
        hasNonEmptyValue(config.bedrock.accessKeyId) &&
        hasNonEmptyValue(config.bedrock.secretAccessKey)
      );

    case "llamaServer":
      return hasNonEmptyValue(config.llamaServer.apiURL);

    case "openAI":
      return (
        hasNonEmptyValue(config.openAI.apiURL) &&
        hasNonEmptyValue(config.openAI.apiKey)
      );
  }
};
