import {
  BedrockRuntime,
  ConverseCommand,
  ConverseStreamCommand,
  Message,
  SystemContentBlock,
  ContentBlock,
} from "@aws-sdk/client-bedrock-runtime";

import {
  LLMAdapter,
  StreamingOptions,
  StreamingProcessor,
  StreamingStats,
  TextMessage,
} from "./types";
import { BedrockLLMConfig } from "../config";
import { PreparedRequest } from "./types";
import { DEFAULT_MAX_TOKENS } from "./constants";

const createBedrockSystem = (
  system: PreparedRequest["system"],
): SystemContentBlock[] => {
  return system.map(
    (block) =>
      ({
        text: block.text,
      }) satisfies SystemContentBlock,
  );
};

const createBedrockMessages = (
  messages: PreparedRequest["messages"],
): Message[] =>
  messages.map(
    (message) =>
      ({
        role: message.role,
        content: [
          ...message.content.map(
            (block) =>
              ({
                text: block.text,
              }) satisfies ContentBlock,
          ),
        ],
      }) satisfies Message,
  );

const createBedrockInstance = (
  region: string,
  keyID: string,
  keySecret: string,
) => {
  return new BedrockRuntime({
    region,
    credentials: {
      accessKeyId: keyID,
      secretAccessKey: keySecret,
    },
  });
};

export class BedrockLLMAdapter implements LLMAdapter {
  private readonly client: BedrockRuntime;
  private readonly modelId: string;

  constructor(private readonly config: BedrockLLMConfig) {
    this.client = createBedrockInstance(
      config.region,
      config.accessKeyId,
      config.secretAccessKey,
    );
    this.modelId = config.modelName;
  }

  async answer(utterance: string): Promise<string> {
    const userMessage: TextMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: utterance,
        },
      ],
    };

    const command = new ConverseCommand({
      modelId: this.modelId,
      messages: [userMessage],
      //      inferenceConfig: { maxTokens: DEFAULT_MAX_TOKENS, temperature: 0.5, topP: 0.9 },
    });

    try {
      const response = await this.client.send(command);
      const content = response?.output?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }
      const responseText = content[0].text;
      return responseText || "";
    } catch (err) {
      console.error(`ERROR: Can't invoke '${this.modelId}'. Reason: ${err}`);
      throw err;
    }
  }

  async countTokens(text: string): Promise<number> {
    const response = await this.client.countTokens({
      modelId: this.modelId,
      input: {
        converse: {
          messages: [
            {
              role: "user",
              content: [{ text }],
            },
          ],
        },
      },
    });
    return response.inputTokens ?? 0;
  }

  async stream(
    request: PreparedRequest,
    params: StreamingOptions,
    processor: StreamingProcessor,
  ): Promise<StreamingStats> {
    const requestTime = Date.now();
    let first_token_time_ms: number | undefined;

    let message_start_stats: {
      start_time: number;
    } | null = null;

    let message_metadata_stats: {
      input_cached: number;
      saved_to_cache: number;
      input_uncached: number | undefined;
      output_tokens: number | undefined;
    } = {
      input_cached: 0,
      saved_to_cache: 0,
      input_uncached: undefined,
      output_tokens: undefined,
    };

    const command = new ConverseStreamCommand({
      system: createBedrockSystem(request.system),
      messages: createBedrockMessages(request.messages),
      modelId: this.modelId,
      inferenceConfig: {
        maxTokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        // temperature: params.temperature ?? 0.5,
        // topP: params.topP ?? 0.9,
      },
    });

    try {
      const response = await this.client.send(command);
      if (!response.stream) {
        throw new Error("No stream in response");
      }

      for await (const chunk of response.stream) {
        if (chunk.contentBlockDelta?.delta?.text) {
          if (!first_token_time_ms) {
            first_token_time_ms = Date.now() - requestTime;
          }
          processor.push(chunk.contentBlockDelta.delta.text);
        }

        if (chunk.messageStart) {
          message_start_stats = {
            start_time: Date.now() - requestTime,
          };
        }

        if (chunk.metadata) {
          const usage = (chunk.metadata.usage ?? {}) as Record<
            string,
            number | undefined
          >;
          message_metadata_stats = {
            input_cached: usage["cacheReadInputTokens"] ?? 0,
            saved_to_cache: usage["cacheWriteInputTokens"] ?? 0,
            input_uncached: usage["inputTokens"],
            output_tokens: usage["outputTokens"],
          };
        } else if (chunk.messageStop) {
          processor.done();
        }
      }

      if (!message_start_stats) {
        throw new Error("No message_start event received");
      }

      return {
        model: this.modelId,
        token_counts: {
          input_cached: message_metadata_stats.input_cached,
          saved_to_cache: message_metadata_stats.saved_to_cache,
          input_uncached: message_metadata_stats?.input_uncached,
          output: message_metadata_stats?.output_tokens,
        },
        first_token_time_ms,
        total_time_ms: Date.now() - requestTime,
      };
    } catch (err) {
      console.error(`ERROR: Can't invoke '${this.modelId}'. Reason: ${err}`);
      throw err;
    }
  }
}
