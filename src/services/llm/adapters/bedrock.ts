import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
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

const createBedrockInstance = (
  region: string,
  keyID: string,
  keySecret: string
) => {
  return new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId: keyID,
      secretAccessKey: keySecret,
    },
  });
};

export class BedrockLLMAdapter implements LLMAdapter {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;

  constructor(private readonly config: BedrockLLMConfig) {
    this.client = createBedrockInstance(
      config.region,
      config.accessKeyId,
      config.secretAccessKey
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
      //      inferenceConfig: { maxTokens: 256, temperature: 0.5, topP: 0.9 },
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

  async stream(
    request: PreparedRequest,
    params: StreamingOptions,
    processor: StreamingProcessor
  ): Promise<StreamingStats> {
    const requestTime = Date.now();
    let first_token_time_ms: number | undefined;

    let message_start_stats: {
      start_time: number;
    } | null = null;

    let message_metadata_stats: {
      input_uncached: number | undefined;
      output_tokens: number | undefined;
    } = { input_uncached: undefined, output_tokens: undefined };

    const command = new ConverseStreamCommand({
      ...request,
      modelId: this.modelId,
      inferenceConfig: {
        maxTokens: params.maxTokens ?? 256,
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
          const usage = chunk.metadata.usage;
          message_metadata_stats = {
            input_uncached: usage?.inputTokens,
            output_tokens: usage?.outputTokens,
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
          input_cached: 0,
          saved_to_cache: 0,
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
