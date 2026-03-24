import { FullLLMConfig } from "../config";
import { LLMAdapter } from "./types";

export const createLLMAdapter = async (
  config: FullLLMConfig,
): Promise<LLMAdapter> => {
  switch (config.selected) {
    case "anthropic": {
      const { AnthropicLLMAdapter } = await import("./anthropic");
      return new AnthropicLLMAdapter(config.anthropic);
    }
    case "bedrock": {
      const { BedrockLLMAdapter } = await import("./bedrock");
      return new BedrockLLMAdapter(config.bedrock);
    }
    case "llamaServer": {
      const { LlamaServerLLMAdapter } = await import("./llamaServer");
      return new LlamaServerLLMAdapter(config.llamaServer);
    }
    case "openAI":
      throw new Error(`Not implemented yet`);
  }
};
