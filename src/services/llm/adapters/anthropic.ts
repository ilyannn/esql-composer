import Anthropic from "@anthropic-ai/sdk";

import { LLMAdapter } from "./types";
import { AnthropicLLMConfig, AnthropicModelName } from "../config";

const createAnthropicInstance = (apiKey: string) => {
  return new Anthropic({
    apiKey,
    defaultHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
    dangerouslyAllowBrowser: true,
  });
};


export class AnthropicLLMAdapter implements LLMAdapter {
  private readonly client: Anthropic;
  private readonly modelName: AnthropicModelName;

  constructor(private readonly config: AnthropicLLMConfig) {
    this.client = createAnthropicInstance(config.apiKey);
    this.modelName = config.modelName;
  }

  async answer(utterance: string): Promise<string> {
    const response = await this.client.messages.create({
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: utterance }],
        },
      ],
      model: this.modelName,
      max_tokens: 256,
    });
    const block = response.content[0];
    if (block.type !== "text") {
      return "";
    }
    return block.text;
  }

  async countTokens(text: string): Promise<number> {
    const response = await this.client.beta.messages.countTokens({
      betas: ["token-counting-2024-11-01"],
      model: this.modelName,
      messages: [{ role: "user", content: text }],
    });

    return response.input_tokens;
  }
}
