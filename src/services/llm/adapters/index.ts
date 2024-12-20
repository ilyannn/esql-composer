import { FullLLMConfig } from "../config";
import { LLMAdapter } from "./types";
import { AnthropicLLMAdapter } from "./anthropic";
import { LlamaServerLLMAdapter } from "./llamaServer";

export const createLLMAdapter = (config: FullLLMConfig): LLMAdapter => {
  switch (config.selected) {
    case "anthropic":
      return new AnthropicLLMAdapter(config.anthropic);
    case "llamaServer":
      return new LlamaServerLLMAdapter(config.llamaServer);
    case "bedrock":
    case "openAI":
      throw new Error(`Not implemented yet`);
  }
};
