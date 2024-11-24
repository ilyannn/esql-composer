import {
  PromptCachingBetaMessageParam,
  PromptCachingBetaTextBlockParam,
} from "@anthropic-ai/sdk/resources/beta/prompt-caching";
import { applyFunctionToField } from "../../models/esql";

import { evalAdapter, ESQLEvalOutput } from "./schema";
import { FieldInfo } from "./types";

type SystemMessage = PromptCachingBetaTextBlockParam;
type TextMessage = {
  role: "user" | "assistant";
  content: PromptCachingBetaTextBlockParam[];
} & PromptCachingBetaMessageParam;

export type ReferenceOptions = {
  esqlGuideText: string;
  schemaGuideText: string;
};

export type PromptOptions = {
  esqlInput?: string;
};

export interface PrepareCompletionRequestOptions {
  type: "completion";
}

export interface PrepareUpdateRequestOptions {
  type: "update";
  naturalInput: string;
}

export interface PrepareTransformationRequestOptions extends PromptOptions {
  type: "transformation";
  field: FieldInfo;
  esqlInput: string;
  naturalInput: string;
}

export type PrepareRequestOptions =
  | PrepareCompletionRequestOptions
  | PrepareUpdateRequestOptions
  | PrepareTransformationRequestOptions;

const requestTextForOptions = (options: PrepareRequestOptions): string => {
  switch (options.type) {
    case "completion":
      return "Please complete the following ES|QL query at the last token, marked *. Return only the completion:";
    case "update":
      return "Prompt: " + options.naturalInput + "\n";
    case "transformation":
      return evalAdapter.formatInput({ task: options.naturalInput });
  }
};

const systemTextForOptions = (options: PrepareRequestOptions): string[] => {
  switch (options.type) {
    case "completion":
      return [
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
`,
      ];
    case "update":
      return [
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
`,
      ];
    case "transformation":
      return [
        `Your task is transform a field from the result of the ES|QL query. 
The prompt is given on the first line then the query is given from the second line and it ends with the '| EVAL '.
For each request (in the examples between <input> and </input> tags) please complete the ES|QL EVAL command.
Output a new field name and the evaluation expression using the format below. Try to only use the field itself but use the other fields as necessary as well. 
Try to keep the expression on a single line. If an explanation is necessary, provide a short one in the corresponding field. 
Here are some examples for 
` +
          evalAdapter.formatContext({
            esqlInput: `FROM kibana_sample_data_flights
| STATS
    avg_delay = AVG(FlightDelayMin)
    BY Carrier
| SORT avg_delay DESC`,
            field: {
              name: "avg_delay",
              type: "double",
              examples: ["49.59"],
            },
          }) +
          "\n\n" +
          evalAdapter.formatExamples([
            {
              task: "convert to hours",
              field: "avg_delay_hours",
              expr: "avg_delay / 60",
              comment: "",
            },
            {
              task: "round and show minutes text",
              field: "avg_delay_text",
              expr: 'CONCAT(TO_STRING(avg_delay::long), " minutes")',
              comment: "Uses the type conversion operator for rounding",
            },
          ]),
        `Your current task will refer to the following context:\n` +
          evalAdapter.formatContext(options),
      ];
  }
};

const userMessageForInput = (input: PrepareRequestOptions): TextMessage => {
  return {
    role: "user",
    content: [
      {
        type: "text",
        text: requestTextForOptions(input),
      },
    ],
  };
};

const cachedAssistantMessageForEvalOutput = (
  output: ESQLEvalOutput
): TextMessage => {
  return {
    role: "assistant",
    content: [
      {
        type: "text",
        text: evalAdapter.formatOutput(output),
        cache_control: { type: "ephemeral" },
      },
    ],
  };
};

const newUppercaseFieldName = (fieldName: string) => {
  let uppercaseFieldName = fieldName.toLocaleUpperCase();
  if (uppercaseFieldName === fieldName) {
    uppercaseFieldName = fieldName + " UPPERCASE";
  }
  return uppercaseFieldName;
};

export const prepareRequest = (
  input: ReferenceOptions & PromptOptions & PrepareRequestOptions
): { system: SystemMessage[]; messages: TextMessage[] } => {
  const { esqlGuideText, schemaGuideText } = input;

  let systemTexts = [
    "You are an AI assistant specialized in Elasticsearch Query Language (ES|QL). You'll help the user compose ES|QL queries. Here's some reference material on ES|QL.",
    esqlGuideText,
  ];

  if (schemaGuideText) {
    systemTexts.push(
      `Here's the schema of the Elasticsearch data you're working with: <schema>\n${schemaGuideText}\n</schema>`
    );
  }

  systemTexts = [...systemTexts, ...systemTextForOptions(input)];

  // Should be no more than 3 cached messages since there are only 4 cache points
  // and we will use one for the last assistant message.
  const system: SystemMessage[] = systemTexts.map((content, index) => {
    const message: SystemMessage = {
      type: "text",
      text: content,
    };
    if (index >= systemTexts.length - 3) {
      message.cache_control = { type: "ephemeral" };
    }
    return message;
  });

  let messages: TextMessage[] = [];

  if (input.type === "transformation") {
    switch (input.field.type) {
      case "keyword":
      case "text":
        messages = [
          userMessageForInput({
            ...input,
            naturalInput: "uppercase",
          }),
          cachedAssistantMessageForEvalOutput({
            field: newUppercaseFieldName(input.field.name),
            expr: applyFunctionToField("TO_UPPER", input.field.name),
          }),
        ];
        break;

      case "double":
      case "float":
        messages = [
          userMessageForInput({
            ...input,
            naturalInput: "round to 2 decimal places",
          }),
          cachedAssistantMessageForEvalOutput({
            field: input.field.name + " Rounded",
            expr: applyFunctionToField("ROUND", input.field.name, 2),
          }),
        ];
        break;
    }
  }

  messages.push(userMessageForInput(input));
  return { system, messages };
};
