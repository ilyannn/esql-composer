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
import { LLMAdapter } from "./adapters/types";
import { DEFAULT_MAX_TOKENS } from "./adapters/constants";

export type WarmCacheRequest = ReferenceOptions;

export type GenerateUpdateRequest = ReferenceOptions &
  PromptOptions &
  (PrepareCompletionRequestOptions | PrepareUpdateRequestOptions) & {
    haveESQLLine?: (line: string) => void;
    doneESQL?: () => void;
    haveExplanationLine?: (line: string) => void;
    processESQLLines?: boolean;
    maxTokens?: number;
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

export type ReduceSizeRequest = ReferenceOptions & {
  processLine: (line: string) => void;
};

export const warmCacheWithAdapter = (
  adapter: LLMAdapter,
  params: WarmCacheRequest,
): Promise<GenerateUpdateOutput> =>
  generateESQLUpdateWithAdapter(adapter, {
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
export const generateESQLUpdateWithAdapter = async (
  adapter: LLMAdapter,
  input: GenerateUpdateRequest,
): Promise<GenerateUpdateOutput> => {
  const {
    type,
    haveESQLLine,
    doneESQL,
    haveExplanationLine,
    maxTokens,
    processESQLLines,
  } = input;

  const requestTime = Date.now();
  let first_token_time_ms: number | undefined;
  let esql_time_ms: number | undefined;
  let isInsideEsql = type === "completion" ? true : undefined;
  let currentLine = "";

  let processLine: (line: string) => void;

  if (processESQLLines !== false) {
    processLine = (line: string) => {
      if (line.startsWith("<esql>") && isInsideEsql === undefined) {
        isInsideEsql = true;
      } else if (line.startsWith("</esql>") && isInsideEsql === true) {
        isInsideEsql = false;
        doneESQL?.();
        esql_time_ms = Date.now() - requestTime;
      } else if (isInsideEsql) {
        haveESQLLine?.(line);
      } else {
        haveExplanationLine?.(line);
      }
    };
  } else if (haveExplanationLine) {
    processLine = haveExplanationLine;
  } else {
    processLine = () => undefined;
  }

  const request = prepareRequest(input);
  const stats = await adapter.stream(
    request,
    { maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS },
    {
      push(textDelta) {
        if (!first_token_time_ms) {
          first_token_time_ms = Date.now() - requestTime;
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
      },
      done() {
        if (currentLine.length > 0) {
          processLine(currentLine);
          currentLine = "";
        }
        if (isInsideEsql) {
          processLine("</esql>");
        }
      },
    },
  );

  return {
    stats: {
      ...stats,
      first_token_time_ms:
        first_token_time_ms ?? stats.first_token_time_ms ?? Infinity,
      esql_time_ms: esql_time_ms ?? Infinity,
    },
  };
};

const REDUCE_SIZE_PROMPT_PREFIX = `Please remove unnecessary information from the provided Elasticsearch Query Language guide which will be used for the ES|QL generation task. Keep relevant information such as list of function names intact but reduce the number of redundant descriptions. Keep enough examples to be able to answer all questions. You will be the consumer of the reduced guide, so feel free to use any tricks that can be helpful. Output the new guide between <esql> and </esql> tags and put any other information outside. Aim at 40% reduction. Here is the old guide again:\n\n<esql>\n`;

export const reduceSizeWithAdapter = async (
  adapter: LLMAdapter,
  input: ReduceSizeRequest,
) => {
  const { esqlGuideText, schemaGuideText, processLine } = input;

  return generateESQLUpdateWithAdapter(adapter, {
    type: "update",
    esqlGuideText,
    schemaGuideText,
    naturalInput: `${REDUCE_SIZE_PROMPT_PREFIX}${esqlGuideText}\n</esql>`,
    haveESQLLine: processLine,
    maxTokens: 8192,
  });
};

export const transformField = async (
  adapter: LLMAdapter,
  params: TransformFieldInput,
): Promise<TransformFieldOutput> => {
  const request = prepareRequest({ ...params });
  let field: string | undefined;
  let esql: string | undefined;
  let esql_time_ms: number | undefined;
  const requestTime = Date.now();

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
