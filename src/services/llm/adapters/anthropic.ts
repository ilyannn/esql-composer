import Anthropic from "@anthropic-ai/sdk";

import { LLMAdapter } from "./types";
import { AnthropicLLMConfig, AnthropicModelName } from "../config";
import { PreparedRequest } from "./types";
import { StreamingOptions, StreamingStats, StreamingProcessor } from "./types";

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

  async stream(
    request: PreparedRequest,
    params: StreamingOptions,
    processor: StreamingProcessor
  ): Promise<StreamingStats> {
    const requestTime = Date.now();
    let first_token_time_ms: number | undefined;

    let message_start_stats = null as {
      model: string;
      start_time: number;
      input_cached: number;
      input_uncached: number;
      saved_to_cache: number;
    } | null;

    let message_delta_stats: {
      output: number;
    } = { output: 0 };

    const stream = this.client.beta.promptCaching.messages
      .stream({
        stream: true,
        model: this.modelName,
        max_tokens: params.maxTokens ?? 256,
        ...request,
      })
      .on("text", (textDelta, _) => {
        if (!first_token_time_ms) {
          first_token_time_ms = Date.now() - requestTime;
        }
        processor.push(textDelta);
      })
      .on("streamEvent", (event) => {
        if (event.type === "message_start") {
          const usage = event.message.usage;
          message_start_stats = {
            model: event.message.model,
            start_time: Date.now() - requestTime,
            input_cached: usage.cache_read_input_tokens || 0,
            input_uncached: usage.input_tokens,
            saved_to_cache: usage.cache_creation_input_tokens || 0,
          };
        } else if (event.type === "message_delta") {
          message_delta_stats = { output: event.usage.output_tokens };
        } else if (event.type === "message_stop") {
          processor.done();
        }
      });

    await stream.finalMessage();

    if (message_start_stats === null) {
      throw new Error("No message_start event received");
    }

    return {
      model: message_start_stats.model,
      token_counts: {
        input_cached: message_start_stats.input_cached,
        input_uncached: message_start_stats.input_uncached,
        saved_to_cache: message_start_stats.saved_to_cache,
        output: message_delta_stats.output,
      },
      first_token_time_ms,
      total_time_ms: Date.now() - requestTime,
    };
  }
}
