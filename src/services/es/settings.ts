import { ESAPIOptions } from "./types";
import { getJSON } from "./base";

interface ESQLSettings {
  defaultSize?: number;
  maxSize?: number;
}

/**
 * Fetches ESQL-specific settings from Elasticsearch
 * @param apiURL The base URL of the Elasticsearch instance
 * @param apiKey API key for authentication
 * @returns Promise containing the ESQL settings
 */
export const getESQLSettings = async ({
  apiURL,
  apiKey,
}: ESAPIOptions): Promise<ESQLSettings> => {
  const response = (await getJSON(`${apiURL}/_cluster/settings`, apiKey, {
    include_defaults: "true",
  })) as any;

  // Extract the settings from the response
  const defaults = response?.defaults?.esql?.query;
  const persistent = response?.persistent?.esql?.query;
  const transient = response?.transient?.esql?.query;

  const to_number = (setings: any, field: string) => {
    const value = setings?.[field];
    return value !== undefined ? Number(value) : undefined;
  };

  const mapSettings = (settings: any) => {
    const result: ESQLSettings = {};
    const size = to_number(settings, "result_truncation_default_size");
    const maxSize = to_number(settings, "result_truncation_max_size");

    if (size !== undefined) result.defaultSize = size;
    if (maxSize !== undefined) result.maxSize = maxSize;

    return result;
  };

  // Merge the settings
  return {
    ...mapSettings(defaults),
    ...mapSettings(persistent),
    ...mapSettings(transient),
  };
};
