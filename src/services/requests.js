import Anthropic from "@anthropic-ai/sdk";

export const warmCache = async (apiKey, modelSelected, esql, schema) => {
  return await generateESQLUpdate(
    apiKey,
    modelSelected,
    esql,
    schema,
    undefined
  );
};

export const MODEL_LIST = [
  "claude-3-5-haiku-latest",
  "claude-3-5-sonnet-latest",
];

export const testWithSimpleQuestion = async (apiKey, modelSelected) => {
  const anthropic = createAnthropicInstance(apiKey);

  const response = await anthropic.messages.create({
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: "Are you an LLM?" }],
      },
    ],
    model: MODEL_LIST[modelSelected],
    max_tokens: 256,
  });

  return response.content[0].text;
};

const createAnthropicInstance = (apiKey) => {
  return new Anthropic({
    apiKey,
    defaultHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
    dangerouslyAllowBrowser: true,
  });
};

const prepareRequest = (
  esqlGuideText,
  schemaGuideText,
  esqlInput,
  naturalInput
) => {
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
      `Your task is to convert the natural language prompts to ES|QL. For each request (between input tags) please answer with a nicely formatted ES|QL query for the completion. The current query, if any, is given from the second line. Here are some examples:
<example>
<input>
Prompt: event codes by occurrence
<input>
<output>
\`\`\`esql
FROM logs-* 
| STATS event_code_count = COUNT(event.code) BY event.code 
| SORT event_code_count DESC 
\`\`\`

This query shows the event codes sorted by occurrence count in descending order.
</output>
</example>

<example>
<input>
Prompt: top outbound trafic from process curl.exe
</input>
<output>
\`\`\`esql
FROM logs-endpoint 
| WHERE process.name == "curl.exe" 
| STATS bytes = SUM(destination.bytes) BY destination.address 
| EVAL kb =  bytes/1024 
| SORT kb DESC 
| LIMIT 10
| KEEP kb,destination.address
\`\`\`
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
\`\`\`esql
FROM logs-endpoint 
| WHERE process.name == "explorer.exe" 
| STATS bytes = SUM(destination.bytes) BY destination.address 
| EVAL kb =  bytes/1024 
| SORT kb DESC 
| LIMIT 5
| KEEP kb,destination.address
\`\`\`
</output>
</example>
`
    );
  }

  const system = systemTexts.map((content) => ({
    type: "text",
    text: content,
  }));
  system[system.length - 1].cache_control = { type: "ephemeral" };

  const messages = [];
  let requestText;

  if (naturalInput === undefined) {
    requestText =
      "Please complete the following ES|QL query at the last token, marked *. Return only the completion:\n";
  } else if (naturalInput) {
    requestText = "Prompt: " + naturalInput + "\n";
  } else {
    requestText =
      "Prompt: top 10 outbound trafic destinations from process explorer.exe" +
      "\n";
  }

  if (esqlInput) {
    requestText += esqlInput;
  }

  messages.push({
    role: "user",
    content: [
      {
        type: "text",
        text: requestText,
      },
    ],
  });

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
 * @param {Function} [haveESQLLine] - Optional callback function to handle ESQL lines.
 * @param {Function} [haveExplanationLine] - Optional callback function to handle explanation lines.
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
  apiKey,
  modelSelected,
  esql,
  schema,
  esqlInput,
  naturalInput,
  haveESQLLine = undefined,
  doneESQL = undefined,
  haveExplanationLine = undefined
) => {
  const anthropic = createAnthropicInstance(apiKey);

  const requestTime = Date.now();
  const isCompletionRequest = naturalInput === undefined;
  let first_token_time = null;
  let esql_time = null;
  let isInsideEsql = isCompletionRequest ? true : undefined;
  let currentLine = "";
  let result = {};

  const processLine = (line) => {
    if (line.startsWith("```esql") && isInsideEsql === undefined) {
      isInsideEsql = true;
    } else if (line.startsWith("```") && isInsideEsql === true) {
      isInsideEsql = false;
      doneESQL?.();
      esql_time = Date.now() - requestTime;
    } else if (isInsideEsql) {
      haveESQLLine?.(line);
    } else {
      haveExplanationLine?.(line);
    }
  };

  const stream = anthropic.messages
    .stream({
      stream: true,
      model: MODEL_LIST[modelSelected],
      max_tokens: 256,
      ...prepareRequest(esql, schema, esqlInput, naturalInput),
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
        currentLine = lines.pop();
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
          processLine("```");
        }
      } else if (event.type === "message_start") {
        const usage = event.message.usage;
        result.stats = {
          model: event.message.model,
          start_time: Date.now() - requestTime,
          input_cached: usage.cache_read_input_tokens,
          input_uncached: usage.input_tokens,
          saved_to_cache: usage.cache_creation_input_tokens,
        };
      } else if (event.type === "message_delta") {
        result.stats.output = event.usage.output_tokens;
      }
    });

  await stream.finalMessage();

  result.stats.total_time = Date.now() - requestTime;
  result.stats.first_token_time = first_token_time;
  result.stats.esql_time = esql_time;
  return result;
};
