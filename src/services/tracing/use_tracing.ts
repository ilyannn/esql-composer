import { TracingOption } from "./types";
import { postJSON } from "../es/base";
import { ESAPIOptions } from "../es/types";
import { deeplyMergeElasticsearchJSONs } from "../es/utils";

export interface UseTracingInput extends ESAPIOptions {
  option: TracingOption;
  traceId?: string | undefined;
}

export type UseTracingCallback = (data: Record<string, any>) => void;
export interface UseTracingOutput {
  addToSpan: UseTracingCallback;
  saveSpan: () => void;
}

export const useTracing = ({
  apiURL,
  apiKey,
  option,
  traceId = undefined,
}: UseTracingInput): UseTracingOutput => {
  if (apiURL.length === 0 || apiKey.length === 0 || !option.enabled) {
    return {
      addToSpan: (_data: Record<string, any>) => undefined,
      saveSpan: () => undefined,
    };
  }

  let traceData: Record<string, any> = {
    "@timestamp": new Date().toISOString(),
    // agent: {
    //   name: "ES|QL Composer",
    //   type: "application",
    // },
    host: {
      hostname: window.location.hostname,
    },
    service: {
      address: window.location.href,
      environment: process.env["NODE_ENV"] || "",
    },
  };

  if (traceId) {
    traceData = { ...traceData, trace: { id: traceId } };
  }

  return {
    addToSpan: (data: Record<string, any>) => {
      traceData = deeplyMergeElasticsearchJSONs(traceData, data);
    },
    saveSpan: () => {
      postJSON(`${apiURL}/${option.indexName}/_doc`, apiKey, traceData).catch(
        (error) => {
          console.error(`Failed to index trace data: ${error}`);
        },
      );
    },
  };
};
