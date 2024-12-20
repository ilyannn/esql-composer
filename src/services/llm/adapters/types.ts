import { PreparedRequest } from "../prompts";

export interface StreamingOptions {
  maxTokens?: number;
}

export interface StreamingStats {
  model: string;
  token_counts: {
    input_cached: number;
    input_uncached: number;
    saved_to_cache: number;
    output: number;
  };
  first_token_time_ms: number;
  total_time_ms: number;
}

/**
 * Interface representing a streaming processor that handles chunks of data.
 */
export interface StreamingProcessor {
  /**
   * Processes a chunk of data.
   * @param chunk - The chunk of data to be processed.
   */
  push(chunk: string): void;

  /**
   * Signals that all chunks have been processed.
   */
  done(): void;
}

export interface LLMAdapter {
  answer(utterance: string): Promise<string>;

  countTokens?(text: string): Promise<number>;

  stream?(
    request: PreparedRequest,
    params: StreamingOptions,
    processor: StreamingProcessor
  ): Promise<StreamingStats>;
}
