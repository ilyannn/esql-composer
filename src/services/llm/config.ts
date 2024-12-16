export type AnthropicModelName =
  | "claude-3-5-haiku-latest"
  | "claude-3-5-sonnet-latest";

export const ANTHROPIC_MODEL_LIST: [string, AnthropicModelName][] = [
  ["Haiku", "claude-3-5-haiku-latest"],
  ["Sonnet", "claude-3-5-sonnet-latest"],
  //  ["Opus", "claude-3-5-opus-latest"], -- not avilable yet
];

interface LLMConfigWorks {
  isKnownToWork?: boolean | undefined;
}

export interface AnthropicLLMConfig extends LLMConfigWorks {
  apiKey: string;
  modelName: AnthropicModelName;
}

export interface LlamaServerLLMConfig extends LLMConfigWorks {
  serverURL: string;
  apiKey: string;
}

export type OneOfLLMConfigs = AnthropicLLMConfig | LlamaServerLLMConfig;

export type LLMChoice = "anthropic" | "llamaServer";

export interface FullLLMConfig extends Record<LLMChoice, OneOfLLMConfigs> {
  selected: LLMChoice;
  anthropic: AnthropicLLMConfig;
  llamaServer: LlamaServerLLMConfig;
}

export const defaultLLMConfig: FullLLMConfig = {
  selected: "anthropic",
  anthropic: {
    apiKey: "",
    modelName: ANTHROPIC_MODEL_LIST[0][1],
  },
  llamaServer: {
    serverURL: "http://localhost:8080",
    apiKey: "",
  },
};

export const isLLMConfigSufficent = (config: FullLLMConfig): boolean => {
  switch (config.selected) {
    case "anthropic":
      return config.anthropic.apiKey.length > 0;
    case "llamaServer":
      return config.llamaServer.serverURL.length > 0;
  }
};
