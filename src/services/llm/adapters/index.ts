import { FullLLMConfig } from "../config";
import { LLMAdapter } from "./types";
import { AnthropicLLMAdapter } from "./anthropic";
import { LlamaServerLLMAdapter } from "./llamaServer";
import { BedrockLLMAdapter } from "./bedrock";

export const createLLMAdapter = (config: FullLLMConfig): LLMAdapter => {
  switch (config.selected) {
    case "anthropic":
      return new AnthropicLLMAdapter(config.anthropic);
    case "bedrock":
      return new BedrockLLMAdapter(config.bedrock);
    case "llamaServer":
      return new LlamaServerLLMAdapter(config.llamaServer);
    case "openAI":
      throw new Error(`Not implemented yet`);
  }
};
