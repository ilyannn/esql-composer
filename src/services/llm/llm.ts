import Anthropic from "@anthropic-ai/sdk";

import { LLMStatisticsRow } from "../../common/types";
import {
  PrepareCompletionRequestOptions,
  prepareRequest,
  PrepareTransformationRequestOptions,
  PrepareUpdateRequestOptions,
  PromptOptions,
  ReferenceOptions,
} from "./prompts";
import { PseudoXMLHandler, PseudoXMLParser } from "./pseudo-xml";
import { ESQLEvalOutputSchema, ESQLEvalOutputTag } from "./schema";
import { AnthropicModelName } from "./config";
import { LLMAdapter } from "./adapters/types";
import { DEFAULT_MAX_TOKENS } from "./adapters/constants";

export type LLMOptions = {
  apiKey: string;
  modelName: AnthropicModelName;
  maxTokens?: number;
};

export type WarmCacheInput = LLMOptions & ReferenceOptions;

export type GenerateUpdateInput = LLMOptions &
  ReferenceOptions &
  PromptOptions &
  (PrepareCompletionRequestOptions | PrepareUpdateRequestOptions) & {
    haveESQLLine?: (line: string) => void;
    doneESQL?: () => void;
    haveExplanationLine?: (line: string) => void;
    processESQLLines?: boolean;
  };

export type GenerateUpdateOutput = {
  stats: LLMStatisticsRow;
};

export type TransformFieldInput = { maxTokens?: number } & ReferenceOptions &
  PromptOptions &
  PrepareTransformationRequestOptions & {
    doneEvalExpression: (field: string, expr: string) => void;
    haveExplanationLine?: (line: string) => void;
  };

interface TransformFieldOutput {
  stats: LLMStatisticsRow;
  gen_ai: { prompt: string; completion: string };
}

export type ReduceSizeInput = LLMOptions &
  ReferenceOptions & {
    processLine: (line: string) => void;
  };

const createAnthropicInstance = (apiKey: string) => {
  return new Anthropic({
    apiKey,
    defaultHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
    dangerouslyAllowBrowser: true,
  });
};

export const warmCache = (params: WarmCacheInput): Promise<any> =>
  generateESQLUpdate({
    ...params,
    type: "update",
    naturalInput: "top flights",
  });

/**
 * Generates an ESQL update using the Anthropic API.
 *
 * @param {string} apiKey - The API key for authentication.
 * @param {string} esql - The ESQL query to be updated.
 * @param {Object} schema - The schema for the ESQL query.
 * @param {string} esqlInput - The ESQL input.
 * @param {string|undefined} naturalInput - The natural language input. Undefined for completion requests.
 * @param {Function|undefined} [haveESQLLine] - Optional callback function to handle ESQL lines.
 * @param {Function|undefined} [haveExplanationLine] - Optional callback function to handle explanation lines.
 * @returns {Promise<Object>} - A promise that resolves to an object containing statistics about the request.
 * @property {string} result.text - The completed text from the API.
 * @property {string} result.esql - The ESQL result from the API.
 * @property {Object} result.stats - Statistics about the API request.
 */
export const generateESQLUpdate = async (
  input: GenerateUpdateInput,
): Promise<GenerateUpdateOutput> => {
  const anthropic = createAnthropicInstance(input.apiKey);
  const {
    type,
    modelName,
    haveESQLLine,
    doneESQL,
    haveExplanationLine,
    maxTokens,
    processESQLLines,
  } = input;

  const requestTime = Date.now();
  let first_token_time: number | null = null;
  let esql_time: number | null = null;
  let isInsideEsql = type === "completion" ? true : undefined;
  let currentLine = "";

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

  let processLine: (line: string) => void;

  if (processESQLLines !== false) {
    processLine = (line: string) => {
      if (line.startsWith("<esql>") && isInsideEsql === undefined) {
        isInsideEsql = true;
      } else if (line.startsWith("</esql>") && isInsideEsql === true) {
        isInsideEsql = false;
        doneESQL?.();
        esql_time = Date.now() - requestTime;
      } else if (isInsideEsql) {
        haveESQLLine?.(line);
      } else {
        haveExplanationLine?.(line);
      }
    };
  } else if (haveExplanationLine) {
    processLine = haveExplanationLine;
  } else {
    processLine = () => {};
  }

  const request = prepareRequest(input);

  const stream = anthropic.beta.promptCaching.messages
    .stream({
      stream: true,
      model: modelName,
      max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
      ...request,
    })
    .on("text", (textDelta, _) => {
      if (!first_token_time) {
        first_token_time = Date.now() - requestTime;
      }
      currentLine += textDelta;
      if (type === "completion" && currentLine.startsWith("*")) {
        currentLine = currentLine.slice(1);
      }
      if (currentLine.includes("\n")) {
        const lines = currentLine.split("\n");
        currentLine = lines.pop()!;
        lines.forEach(processLine);
      }
    })
    .on("streamEvent", (event) => {
      if (event.type === "message_stop") {
        if (currentLine.length > 0) {
          processLine(currentLine);
          currentLine = "";
        }
        if (isInsideEsql) {
          processLine("</esql>");
        }
      } else if (event.type === "message_start") {
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
      }
    });

  await stream.finalMessage();

  if (message_start_stats === null) {
    throw new Error("No message_start event received");
  }

  return {
    stats: {
      model: message_start_stats.model,
      token_counts: {
        input_cached: message_start_stats.input_cached,
        input_uncached: message_start_stats.input_uncached,
        saved_to_cache: message_start_stats.saved_to_cache,
        output: message_delta_stats.output,
      },
      first_token_time_ms: first_token_time || Infinity,
      esql_time_ms: esql_time || Infinity,
      total_time_ms: Date.now() - requestTime,
    },
  };
};

export const reduceSize = async (input: ReduceSizeInput) => {
  const { apiKey, modelName, esqlGuideText, schemaGuideText, processLine } =
    input;

  return await generateESQLUpdate({
    type: "update",
    apiKey,
    modelName,
    esqlGuideText,
    schemaGuideText,
    naturalInput: `Please remove unnecessary information from the provided Elasticsearch Query Language guide which will be used for the ES|QL generation task. Keep relevant information such as list of function names intact but reduce the number of redundant descriptions. Keep enough examples to be able to answer all questions. You will be the consumer of the reduced guide, so feel free to use any tricks that can be helpful. Output the new guide between <esql> and </esql> tags and put any other information outside. Aim at 40% reduction. Here is the old guide again:\n\n<esql>\n${esqlGuideText}\n</esql>`,
    haveESQLLine: processLine,
    maxTokens: 8192,
  });
};

export type CountTokensInput = LLMOptions & {
  text: string;
};

export const countTokens = async (params: CountTokensInput) => {
  const client = createAnthropicInstance(params.apiKey);

  const response = await client.beta.messages.countTokens({
    betas: ["token-counting-2024-11-01"],
    model: params.modelName,
    messages: [{ role: "user", content: params.text }],
  });

  return response.input_tokens;
};

import { AnthropicLLMAdapter } from "./adapters/anthropic";

export const transformField = async (
  adapter: LLMAdapter,
  params: TransformFieldInput,
): Promise<TransformFieldOutput> => {
  const request = prepareRequest({ ...params });
  let field: string | undefined;
  let esql: string | undefined;
  let esql_time_ms: number | undefined;

  const parseEvents: PseudoXMLHandler<ESQLEvalOutputTag> = {
    onReadLine(tag: ESQLEvalOutputTag | null, line) {
      if (tag === "comment") {
        params.haveExplanationLine?.(line);
      }
    },
    onCloseTag(tag, text) {
      if (tag === "expr") {
        esql = text;
      } else if (tag === "field") {
        field = text;
      }
      if (field && esql) {
        params.doneEvalExpression(field, esql);
        esql_time_ms = Date.now() - requestTime;
        field = undefined;
        esql = undefined;
      }
    },
  };

  const parser = new PseudoXMLParser(ESQLEvalOutputSchema, parseEvents);
  const requestTime = Date.now();

  if (adapter.stream === undefined) {
    throw new Error("Adapter does not support streaming");
  }

  const stats = await adapter.stream(
    request,
    { maxTokens: params.maxTokens ?? DEFAULT_MAX_TOKENS },
    parser,
  );

  return {
    gen_ai: {
      prompt: params.naturalInput,
      completion: parser.getFullText(),
    },
    stats: {
      ...stats,
      esql_time_ms,
    },
  };
};
