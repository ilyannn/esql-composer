export const CLAUDE_MODEL_LIST = [
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

export type LLMChoice = "anthropic" | "bedrock" | "llamaServer" | "openAI";

/**
 * Retrieves the index of the specified Anthropic model name from the CLAUDE_MODEL_LIST.
 * If the model name is not found, it returns 0.
 *
 * @param modelName - The name of the Anthropic model to find.
 * @returns The index of the specified model name in the CLAUDE_MODEL_LIST, or 0 if not found.
 */
export const getAnthropicModelIndex = (
  modelName: AnthropicModelName
): ClaudeModelIndex =>
  Math.max(
    0,
    CLAUDE_MODEL_LIST.findIndex((model) => model.anthropic === modelName)
  ) as ClaudeModelIndex;

/**
 * Retrieves the index of the specified Bedrock model name from the CLAUDE_MODEL_LIST.
 * If the model name is not found, it returns 0.
 * @param modelName - The name of the Bedrock model to find.
 * @returns The index of the specified model name in the CLAUDE_MODEL_LIST, or 0 if not found.
 */
export const getBedrockModelIndex = (
  modelName: BedrockModelName
): ClaudeModelIndex =>
  Math.max(
    0,
    CLAUDE_MODEL_LIST.findIndex((model) => model.bedrock === modelName)
  ) as ClaudeModelIndex;

interface BaseLLMConfig {
  type: LLMChoice;
  isKnownToWork?: boolean | undefined;
}

export interface AnthropicLLMConfig extends BaseLLMConfig {
  type: "anthropic";
  apiKey: string;
  modelName: AnthropicModelName;
}

export interface BedrockLLMConfig extends BaseLLMConfig {
  type: "bedrock";
  region: string;
  keyID: string;
  keySecret: string;
  modelName: BedrockModelName;
}

export interface LlamaServerLLMConfig extends BaseLLMConfig {
  type: "llamaServer";
  apiURL: string;
  apiKey: string;
}

export interface OpenAILLMConfig extends BaseLLMConfig {
  type: "openAI";
  apiURL: string;
  apiKey: string;
}

export type OneOfLLMConfigs =
  | AnthropicLLMConfig
  | BedrockLLMConfig
  | LlamaServerLLMConfig
  | OpenAILLMConfig;

export interface FullLLMConfig extends Record<LLMChoice, OneOfLLMConfigs> {
  selected: LLMChoice;
  anthropic: AnthropicLLMConfig;
  bedrock: BedrockLLMConfig;
  llamaServer: LlamaServerLLMConfig;
  openAI: OpenAILLMConfig;
}

export const defaultLLMConfig: FullLLMConfig = {
  selected: "anthropic",
  anthropic: {
    type: "anthropic",
    apiKey: "",
    modelName: CLAUDE_MODEL_LIST[0].anthropic,
  },
  bedrock: {
    type: "bedrock",
    region: "us-east-1",
    keyID: "",
    keySecret: "",
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
};

export const isLLMConfigSufficent = (config: FullLLMConfig): boolean => {
  switch (config.selected) {
    case "anthropic":
      return config.anthropic.apiKey.length > 0;

    case "bedrock":
      return (
        config.bedrock.keyID.length > 0 &&
        config.bedrock.keySecret.length > 0
      );

    case "llamaServer":
      return config.llamaServer.apiURL.length > 0;

    case "openAI":
      return config.openAI.apiURL.length > 0 && config.openAI.apiKey.length > 0;
  }
};
