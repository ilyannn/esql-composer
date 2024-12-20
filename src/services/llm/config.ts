import { c } from "react-compiler-runtime";

export type AnthropicModelName =
  | "claude-3-5-haiku-latest"
  | "claude-3-5-sonnet-latest";

export const ANTHROPIC_MODEL_LIST: [string, AnthropicModelName][] = [
  ["Haiku", "claude-3-5-haiku-latest"],
  ["Sonnet", "claude-3-5-sonnet-latest"],
  //  ["Opus", "claude-3-5-opus-latest"], -- not avilable yet
];

export type LLMChoice = "anthropic" | "bedrock" | "llamaServer" | "openAI";

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
  apiURL: string;
  keyName: string;
  keySecret: string;
  modelName: AnthropicModelName;
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
    modelName: ANTHROPIC_MODEL_LIST[0][1],
  },
  bedrock: {
    type: "bedrock",
    apiURL: "http://localhost:8080",
    keyName: "",
    keySecret: "",
    modelName: ANTHROPIC_MODEL_LIST[0][1],
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
        config.bedrock.apiURL.length > 0 &&
        config.bedrock.keyName.length > 0 &&
        config.bedrock.keySecret.length > 0
      );

    case "llamaServer":
      return config.llamaServer.apiURL.length > 0;

    case "openAI":
      return config.openAI.apiURL.length > 0 && config.openAI.apiKey.length > 0;
  }
};
