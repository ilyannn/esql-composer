import { tableDataToRecords } from "./types";
import { postJSON, postJSONAcceptFormat } from "./base";
import {
  QueryAPIError,
  ESQLQueryOptions,
  ESQLExportOptions,
  ESQLTableData,
  isESQLTableData,
  ESAPIOptions,
} from "./types";
import { downloadFile } from "../browser";
import { dump, DumpOptions } from "js-yaml";

export interface PerformESQLQueryStatistics {
  total_time_ms: number;
}

interface PerformESQLQueryOutput {
  data: ESQLTableData;
  stats: PerformESQLQueryStatistics;
}

export const performESQLQuery = async ({
  apiURL,
  apiKey,
  query,
}: ESQLQueryOptions): Promise<PerformESQLQueryOutput> => {
  const start_time = new Date();
  const answer = await postJSON(`${apiURL}/_query`, apiKey, { query });
  const total_time = new Date().getTime() - start_time.getTime();

  if (!isESQLTableData(answer)) {
    throw new QueryAPIError(undefined, "Invalid format of the response data");
  }

  for (const row of answer.values) {
    for (const key in row) {
      if (Array.isArray(row[key]) && row[key].length === 1) {
        row[key] = row[key][0];
      }
    }
  }

  return { data: answer, stats: { total_time_ms: total_time } };
};

/**
 * Information about a deployment returned by SHOW INFO.
 */
export interface ESQLShowInfo {
  date: string;
  hash: string;
  version: string;
}

/**
 * Type guard function to check if the given data is of type ESQLShowInfo.
 *
 * @param data - The data to be checked.
 * @returns A boolean indicating whether the data is of type ESQLShowInfo.
 */
const isESQLShowInfo = (data: any): data is ESQLShowInfo => {
  return (
    "date" in data &&
    "hash" in data &&
    "version" in data &&
    typeof data.date === "string" &&
    typeof data.hash === "string" &&
    typeof data.version === "string"
  );
};

/**
 * Executes an ESQL query to retrieve information about the Elasticsearch instance.
 *
 * @param {ESAPIOptions} options - The options for the Elasticsearch API.
 * @param {string} options.apiURL - The URL of the Elasticsearch API.
 * @param {string} options.apiKey - The API key for authenticating with the Elasticsearch API.
 * @returns {Promise<ESQLShowInfo>} A promise that resolves to the information about the Elasticsearch instance.
 * @throws {QueryAPIError} If the response data is in an invalid format.
 */
export const performESQLShowInfoQuery = async ({
  apiURL,
  apiKey,
}: ESAPIOptions): Promise<ESQLShowInfo> => {
  const answer = await performESQLQuery({
    apiURL,
    apiKey,
    query: "SHOW INFO",
  });

  const info = tableDataToRecords(answer.data)[0];

  if (!isESQLShowInfo(info)) {
    throw new QueryAPIError(undefined, "Invalid format of the response data");
  }

  return info;
};

/**
 * Exports data from Elasticsearch using an ESQL query and downloads it as a file.
 *
 * @param options - The export options
 * @param options.apiURL - The base URL of the Elasticsearch API
 * @param options.apiKey - API key for authentication
 * @param options.query - The ESQL query to execute
 * @param options.accept - The accepted content type format for the response
 * @param options.filename - The name of the file to be downloaded
 *
 * @throws Will throw an error if the API request fails
 * @returns A Promise that resolves when the file download is complete
 */
export const exportData = async ({
  apiURL,
  apiKey,
  query,
  format,
  columnar,
  addPreamble,
  filename,
}: ESQLExportOptions): Promise<void> => {
  const response = await postJSONAcceptFormat(
    `${apiURL}/_query`,
    apiKey,
    { query, columnar },
    format.accept,
  );

  let data = await response.blob();

  if (addPreamble) {
    switch (format.id) {
      case "yaml":
        const preamble = {
          query,
          cluster: apiURL,
          timestamp: new Date().toISOString(),
        };
        data = new Blob([dump(preamble), data], { type: format.accept });
        break;
    }
  }

  downloadFile(data, filename);
};
