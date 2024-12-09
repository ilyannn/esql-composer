import { tableDataToRecords } from "./types";
import { postJSON } from "./base";
import {
  QueryAPIError,
  ESQLQueryOptions as PerformESQLQueryInput,
  ESQLTableData,
  isESQLTableData,
  ESAPIOptions,
} from "./types";

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
}: PerformESQLQueryInput): Promise<PerformESQLQueryOutput> => {
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

  return {data: answer, stats: {total_time_ms: total_time}};
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
