import { TracingOption } from "./types";

export interface TracingOptions {
  llm: TracingOption;
  es: TracingOption;
}

export const defaultTracingOptions: TracingOptions = {
  llm: { enabled: false, indexName: "esql-composer-llm" },
  es: { enabled: false, indexName: "esql-composer-es" },
};
