/**
 * Represents optional parameters for LLM streaming.
 *
 * @remarks
 * This interface allows you to specify constraints or limits on the number
 * of tokens emitted during a streaming operation.
 *
 * @property maxTokens
 * (Optional) The maximum number of tokens allowed in a streaming process.
 */
export interface StreamingOptions {
  maxTokens?: number;
}

/**
 * Provides statistics for any LLM streaming operation.
 *
 * @remarks
 * This interface tracks details about the model, token usage, and timing
 * information for performance analysis during streaming.
 *
 * @property model
 * The identifier for the model used in the streaming operation.
 * Whenever possible, filled out from the response metadata.
 *
 * @property token_counts
 * Canonical metrics pertaining to token usage, including cached input,
 * uncached input, tokens newly saved to cache, and tokens in the response.
 *
 * @property first_token_time_ms
 * The time in milliseconds until the first token was received.
 *
 * @property total_time_ms
 * The total time in milliseconds for the entire operation.
 */
export interface StreamingStats {
  model: string;
  token_counts: {
    input_cached: number;
    input_uncached: number | undefined;
    saved_to_cache: number;
    output: number | undefined;
  };
  first_token_time_ms: number | undefined;
  total_time_ms: number;
}

/**
 * Describes a processor for handling chunks of data during streaming.
 *
 * @remarks
 * Implementers can use this interface to process, transform, or buffer
 * incoming textual chunks in real-time.
 *
 * @method push
 * Receives a chunk of text for processing.
 *
 * @method done
 * Signals that no more data chunks will be sent.
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

/**
 * Represents a system context message for the LLM.
 *
 * @remarks
 * This type carries text content and optional cache-control metadata
 * to manage ephemeral or persistent content in a conversation.
 *
 * @property type
 * The system message type indicator.
 *
 * @property text
 * The textual content of the system message.
 *
 * @property cache_control
 * (Optional) Mechanism to specify if the message is meant to be ephemeral.
 */
export type SystemMessage = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" } | null;
};

/**
 * Represents a user-assistant message exchange history and prompt.
 *
 * @remarks
 * This type associates a role (user or assistant) with one or more
 * system messages that collectively form the content of the conversation.
 *
 * @property role
 * The entity that authored the message (user or assistant).
 *
 * @property content
 * A sequence of system messages making up the exchange.
 */
export type TextMessage = {
  role: "user" | "assistant";
  content: SystemMessage[];
};

/**
 * Defines a request object for use with LLMs.
 *
 * @remarks
 * This type bundles a set of system messages and user/assistant
 * messages into a single request, aiding in structured conversation flow.
 *
 * @property system
 * A collection of mesages representing LLM context.
 *
 * @property messages
 * A sequence of user and assistant messages to be consumed by an LLM.
 */
export type PreparedRequest = {
  system: SystemMessage[];
  messages: TextMessage[];
};

/**
 * Interface for interacting with a Large Language Model (LLM).
 *
 * @remarks
 * Implementers must provide synchronous and streaming-based answers,
 * as well as optional token counting functionality.
 *
 * @method answer
 * Returns a response for a given user utterance.
 *
 * @method countTokens
 * (Optional) Calculates the number of tokens for a given text.
 *
 * @method stream
 * Streams token data in real-time, sending chunks
 * to the provided processor and returning usage statistics.
 */
export interface LLMAdapter {
  answer(utterance: string): Promise<string>;

  countTokens?(text: string): Promise<number>;

  stream(
    request: PreparedRequest,
    params: StreamingOptions,
    processor: StreamingProcessor
  ): Promise<StreamingStats>;
}
