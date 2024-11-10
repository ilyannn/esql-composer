import Anthropic from "@anthropic-ai/sdk";

import { StatisticsRow } from "../common/types";
import {
  PromptCachingBetaTextBlockParam,
  PromptCachingBetaMessageParam,
} from "@anthropic-ai/sdk/resources/beta/prompt-caching";

export type LLMOptions = {
  apiKey: string;
  modelSelected: number;
};

export type ReferenceOptions = {
  esqlGuideText: string;
  schemaGuideText: string;
};

export type PromptOptions = {
  esqlInput?: string;
  naturalInput?: string;
};

export type WarmCacheInput = LLMOptions & ReferenceOptions;

export type GenerateUpdateInput = LLMOptions &
  ReferenceOptions &
  PromptOptions & {
    haveESQLLine?: (line: string) => void;
    doneESQL?: () => void;
    haveExplanationLine?: (line: string) => void;
    maxTokens?: number;
    processESQLLines?: boolean;
  };

export type ReduceSizeInput = LLMOptions &
  ReferenceOptions & {
    processLine: (line: string) => void;
  };

export type GenerateUpdateOutput = {
  stats: StatisticsRow;
};

export const MODEL_LIST = [
  "claude-3-5-haiku-latest",
  "claude-3-5-sonnet-latest",
];

const createAnthropicInstance = (apiKey: string) => {
  return new Anthropic({
    apiKey,
    defaultHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
    dangerouslyAllowBrowser: true,
  });
};

export const testWithSimpleUtterance = async (
  input: LLMOptions & {
    utterance: string;
  }
): Promise<string> => {
  const anthropic = createAnthropicInstance(input.apiKey);

  const response = await anthropic.messages.create({
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: input.utterance }],
      },
    ],
    model: MODEL_LIST[input.modelSelected],
    max_tokens: 256,
  });
  const block = response.content[0];
  if (block.type !== "text") {
    return "";
  }
  return block.text;
};

export const warmCache = async (params: WarmCacheInput): Promise<any> => {
  return await generateESQLUpdate({
    ...params,
    esqlInput: "top flights",
  });
};

const prepareRequest = (input: ReferenceOptions & PromptOptions) => {
  const { esqlGuideText, schemaGuideText, esqlInput, naturalInput } = input;

  const systemTexts = [
    "You are an AI assistant specialized in Elasticsearch Query Language (ES|QL). You'll help the user compose ES|QL queries. Here's some reference material on ES|QL.",
    esqlGuideText,
  ];

  if (schemaGuideText) {
    systemTexts.push(
      `Here's the schema of the Elasticsearch data you're working with: <schema>\n${schemaGuideText}\n</schema>`
    );
  }

  if (naturalInput === undefined) {
    systemTexts.push(
      `Your task is to complete the ES|QL query from the last token (marked *). For each request (between input tags) please answer with a line completion of the last line of the query (but do not repeat it). Make sure you provide a space before if necessary. Do not output anything else. Here are some examples:
<example>
<input>
FROM logs-* 
| STATS event_code_count = COUNT(event.code) BY*
</input>
<output>
 event.code
</output>
</example>

<example>
<input>
FROM logs-* 
| STATS event_code_count = COUNT(event.code) BY event.code 
| SORT ev*
</input>
<output>
ent_code_count DESC
</output>
</example>

<example>
<input>
FROM logs-endpoint 
| WHERE process.name == "curl.exe" 
| STATS bytes =*
</input>
<output>
 SUM(destination.bytes) BY destination.address
</output>
</example>

<example>
<input>
FROM logs-endpoint 
| WHERE process.name == "explorer.exe" 
| STATS bytes = SUM(destination.bytes) BY destination.address 
| EVAL kb =  bytes/1024 
| SORT kb DESC 
| LIMIT 5
*
</input>
<output>
| KEEP kb,destination.address
</output>
</example>

<example>
<input>
FROM kibana_sample_data_flights
| WHERE FlightDelay == true
| STATS
    avg_delay = AVG(FlightDelayMin),
    flight_count = COUNT(*)
    BY FlightDelayType
| SORT avg_delay A*
</input>
<output>
SC
</output>
</example>
`
    );
  } else {
    systemTexts.push(
      `Your task is to convert the natural language prompts to ES|QL. The current query, if any, is given from the second line. For each request (in this example between <input> and </input> tags) please answer with a nicely formatted ES|QL query for the completion inside the <esql> and </esql> tags.  Here are some examples:
<example>
<input>
Prompt: event codes by occurrence
<input>
<output>
<esql>
FROM logs-* 
| STATS event_code_count = COUNT(event.code) BY event.code 
| SORT event_code_count DESC 
</esql>

This query shows the event codes sorted by occurrence count in descending order.
</output>
</example>

<example>
<input>
Prompt: top outbound trafic from process curl.exe
</input>
<output>
<esql>
FROM logs-endpoint 
| WHERE process.name == "curl.exe" 
| STATS bytes = SUM(destination.bytes) BY destination.address 
| EVAL kb =  bytes/1024 
| SORT kb DESC 
| LIMIT 10
| KEEP kb,destination.address
</esql>
</output>
</example>

<example>
<input>
Prompt: change process to explorer.exe and do top 5
FROM logs-endpoint 
| WHERE process.name == "curl.exe" 
| STATS bytes = SUM(destination.bytes) BY destination.address 
| EVAL kb =  bytes/1024 
| SORT kb DESC 
| LIMIT 5
| KEEP kb,destination.address
</input>
<output>
<esql>
FROM logs-endpoint 
| WHERE process.name == "explorer.exe" 
| STATS bytes = SUM(destination.bytes) BY destination.address 
| EVAL kb =  bytes/1024 
| SORT kb DESC 
| LIMIT 5
| KEEP kb,destination.address
</esql>
</output>
</example>
`
    );
  }

  const system: PromptCachingBetaTextBlockParam[] = systemTexts.map(
    (content) => ({
      type: "text",
      text: content,
    })
  );

  system[system.length - 1].cache_control = { type: "ephemeral" };

  let requestText;

  if (naturalInput === undefined) {
    // Completion request
    requestText =
      "Please complete the following ES|QL query at the last token, marked *. Return only the completion:\n";
  } else {
    // Generation/update request
    requestText = "Prompt: " + naturalInput + "\n";
  }

  if (esqlInput) {
    requestText += esqlInput;
  }

  const messages: PromptCachingBetaMessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: requestText,
        },
      ],
    },
  ];

  return { system, messages };
};

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
 * @property {number} result.stats.start_time - The start time of the request.
 * @property {number} result.stats.input_cached - The number of cached input tokens.
 * @property {number} result.stats.input_uncached - The number of uncached input tokens.
 * @property {number} result.stats.output - The number of output tokens.
 * @property {number} result.stats.saved_to_cache - The number of tokens saved to cache.
 * @property {number} result.stats.total_time - The total time taken for the request.
 * @property {number} result.stats.first_token_time - The time taken to receive the first token.
 * @property {number} result.stats.text_completion_time - The time taken to complete the prompt.
 */
export const generateESQLUpdate = async (
  input: GenerateUpdateInput
): Promise<GenerateUpdateOutput> => {
  const anthropic = createAnthropicInstance(input.apiKey);
  const {
    modelSelected,
    naturalInput,
    haveESQLLine,
    doneESQL,
    haveExplanationLine,
    maxTokens,
    processESQLLines,
  } = input;

  const requestTime = Date.now();
  const isCompletionRequest = naturalInput === undefined;
  let first_token_time: number | null = null;
  let esql_time: number | null = null;
  let isInsideEsql = isCompletionRequest ? true : undefined;
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

  let processLine;

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
      model: MODEL_LIST[modelSelected],
      max_tokens: maxTokens ?? 256,
      ...request,
    })
    .on("text", (textDelta, _) => {
      if (!first_token_time) {
        first_token_time = Date.now() - requestTime;
      }
      currentLine += textDelta;
      if (isCompletionRequest && currentLine.startsWith("*")) {
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
      input_cached: message_start_stats.input_cached,
      input_uncached: message_start_stats.input_uncached,
      saved_to_cache: message_start_stats.saved_to_cache,  
      output: message_delta_stats.output,

      first_token_time: first_token_time || Infinity,
      esql_time: esql_time || Infinity,
      total_time: Date.now() - requestTime,
    },
  };
};

export const reduceSize = async (input: ReduceSizeInput) => {
  const { apiKey, modelSelected, esqlGuideText, schemaGuideText, processLine } =
    input;

  return await generateESQLUpdate({
    apiKey,
    modelSelected,
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
    model: MODEL_LIST[params.modelSelected],
    messages: [{ role: "user", content: params.text }],
  });

  return response.input_tokens;
};
