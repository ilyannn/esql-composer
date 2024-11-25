import { ESQLColumnType } from "../models/esql/esql_types";

interface ESAPIOptions {
  apiURL: string;
  apiKey: string;
}

interface ESQLQueryOptions extends ESAPIOptions {
  query: string;
}

interface ESQLDeriveSchemaOptions extends ESAPIOptions {
  indexPattern: string;
  randomSamplingFactor: number;
}

export interface TableColumn {
  name: string;
  type: ESQLColumnType
}

export interface TableData {
  columns: TableColumn[];
  values: Array<Array<string | number | boolean | any[] | null>>;
}

export class QueryAPIError extends Error {
  readonly status: number | undefined;
  readonly isAuthorizationError: boolean;

  constructor(status: number | undefined, error: any) {
    super(JSON.stringify(error, null, 2));

    this.status = status;
    this.isAuthorizationError = status === 401;
  }
}

function isTableData(data: any): data is TableData {
  return (
    "columns" in data &&
    "values" in data &&
    Array.isArray(data.columns) &&
    data.columns.every(
      (col: any) => typeof col.name === "string" && typeof col.type === "string"
    ) &&
    Array.isArray(data.values) &&
    data.values.every(
      (row: any) =>
        Array.isArray(row) &&
        row.every(
          (val) =>
            typeof val === "string" ||
            typeof val === "number" ||
            typeof val === "boolean" ||
            (typeof val === "object" && Array.isArray(val)) ||
            val === null
        )
    )
  );
}

/**
 * Trims the provided API key and ensures it is Base64 encoded.
 *
 * @param apiKey - The API key to be checked and possibly encoded.
 * @returns The Base64 encoded API key or the trimmed original if it was already encoded.
 */
const ensureBase64Encoded = (apiKey: string): string => {
  const trimmed = apiKey.trim();
  try {
    atob(trimmed);
  } catch (e) {
    return btoa(trimmed);
  }

  return trimmed;
};

const fetchJSON = async (
  method: string,
  apiKey: string,
  url: string,
  body: string | null
): Promise<object> => {
  const response = await fetch(url, {
    method,
    headers: [
      ["Authorization", `ApiKey ${ensureBase64Encoded(apiKey)}`],
      ["Content-Type", "application/vnd.elasticsearch+json"],
      ["Accept", "application/vnd.elasticsearch+json"],
    ],
    body,
  });

  const answer = await response.json();

  if (answer === null || typeof answer !== "object") {
    throw new QueryAPIError(undefined, "Unexpected API JSON format");
  }

  if ("error" in answer) {
    throw new QueryAPIError(response.status, answer.error);
  }

  if (!response.ok) {
    throw new QueryAPIError(response.status, answer);
  }

  return answer;
};

const postJSON = async (
  url: string,
  apiKey: string,
  bodyObject: object,
  paramObject: Record<string, string> | null = null
): Promise<object> => {
  const newURL = paramObject
    ? `${url}?${new URLSearchParams(paramObject)}`
    : url;
  return await fetchJSON("POST", apiKey, newURL, JSON.stringify(bodyObject));
};

const getJSON = async (
  url: string,
  apiKey: string,
  paramObject: Record<string, string> | null = null
): Promise<object> => {
  const newURL = paramObject
    ? `${url}?${new URLSearchParams(paramObject)}`
    : url;
  return await fetchJSON("GET", apiKey, newURL, null);
};

export const performESQLQuery = async ({
  apiURL,
  apiKey,
  query,
}: ESQLQueryOptions): Promise<TableData> => {
  const answer = await postJSON(`${apiURL}/_query`, apiKey, { query });

  if (!isTableData(answer)) {
    throw new QueryAPIError(undefined, "Invalid format of the response data");
  }

  return answer;
};

/**
 * Information about a deployment returned by SHOW INFO.
 */
export interface ESQLShowInfo {
  "date": string;
  "hash": string;
  "version": string;
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
}

/**
 * Converts table data into an array of records.
 *
 * @param data - The table data to convert, which includes columns and values.
 * @returns An array of records where each record is an object with keys corresponding to column names and values corresponding to the row values.
 */
const tableDataToRecords = (data: TableData): Record<string, any>[] => {
  return data.values.map((row) =>
    row.reduce(
      (acc, val, idx) => ({
        ...acc,
        [data.columns[idx].name]: val,
      }),
      {}
    )
  );
}

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

  const info = tableDataToRecords(answer)[0];

  if (!isESQLShowInfo(info)) {
    throw new QueryAPIError(undefined, "Invalid format of the response data");
  }

  return info;
};

export interface Field {
  key: string;
  isAggregatable: boolean;
  isSearchable: boolean;
  name: string;
  type: string;
  indices: string[];
  examples: string[];
}

interface CapabilitiesResponse {
  indices: string[];
  fields: Record<
    string,
    Record<
      string,
      Record<
        string,
        {
          aggregatable: boolean;
          searchable: boolean;
          type: string;
          indices?: string[];
        }
      >
    >
  >;
}

interface SearchResponse {
  hits: {
    hits: Array<{
      _index: string;
      _source: Record<string, any>;
    }>;
  };
}

interface SamplingAggregationTerms {
  sum_other_doc_count: number;
  doc_count_error_upper_bound: number;
  buckets: Array<{
    key: string | number;
    key_as_string?: string;
    doc_count: number;
  }>;
}

interface SamplingAggregationPercentiles {
  values: Record<string, number>;
}

type SamplingAggregations = Record<
  string,
  SamplingAggregationTerms | SamplingAggregationPercentiles
>;

interface SamplingAggregationsResponse extends SearchResponse {
  aggregations:
    | SamplingAggregations
    | {
        sampling: SamplingAggregations;
      };
}

const parseFieldCapabilities = (
  fieldCapabilities: Record<string, Record<string, Record<string, any>>>
): Field[] => {
  return Object.entries(fieldCapabilities).flatMap(([field, capability]) => {
    return Object.entries(capability).flatMap(([type, typeData]) => {
      return {
        key: `${field}_${type}`,
        name: field,
        type,
        indices: typeData["indices"] || [],
        isAggregatable: typeData["aggregatable"],
        isSearchable: typeData["searchable"],
        examples: [],
      };
    });
  });
};

const AGG_TYPE: Record<string, string> = {
  keyword: "terms",
  ip: "terms",
  boolean: "terms",
  integer: "percentiles",
  long: "percentiles",
  half_float: "percentiles",
  float: "percentiles",
  double: "percentiles",
  date: "percentiles",
};

const createTermsAggregationRequest = (
  fields: Field[],
  randomSamplingFactor: number
) => {
  const aggs: Record<string, any> = fields.reduce(
    (acc: Record<string, any>, field) => {
      if (field.isAggregatable) {
        const aggType = AGG_TYPE[field.type];
        if (aggType === "terms") {
          acc[field.key] = {
            terms: {
              field: field.name,
              size: 5,
            },
          };
        } else if (aggType === "percentiles") {
          acc[field.key] = {
            percentiles: {
              field: field.name,
              percents: [20, 80],
            },
          };
        }
      }
      return acc;
    },
    {}
  );

  if (Object.keys(aggs).length === 0) {
    return null;
  }

  const aggregations =
    randomSamplingFactor === 1
      ? aggs
      : {
          sampling: {
            random_sampler: {
              probability: 1.0 / randomSamplingFactor,
            },
            aggs,
          },
        };

  return {
    size: 0,
    aggregations,
  };
};

const humanizeValue = (value: number, field_key: string): string => {
  if (field_key.endsWith("_date")) {
    return new Date(value).toISOString();
  }
  return value.toPrecision(1);
};

const parseSamplingAggregationResults = (
  results: SamplingAggregationsResponse
): Record<string, string> => {
  const samplingObject =
    "sampling" in results.aggregations
      ? results.aggregations.sampling
      : results.aggregations;
  const acc: Record<string, string> = {};

  Object.entries(samplingObject).forEach(([field_key, term_or_percentile]) => {
    try {
      if (typeof term_or_percentile !== "object") {
        return;
      }
      if ("buckets" in term_or_percentile) {
        const term = term_or_percentile as SamplingAggregationTerms;
        const buckets = term.buckets;

        const usefulExamples = [];
        let usefulExamplesStringLength = 0;
        let usefulExamplesDocCount = 0;
        let otherDocCount =
          term.sum_other_doc_count + term.doc_count_error_upper_bound;

        for (const bucket of buckets) {
          const example =
            typeof bucket.key !== "string"
              ? bucket.key_as_string ?? bucket.key.toString()
              : bucket.key;
          if (
            example.length === 0 ||
            example.length > 35 ||
            usefulExamplesStringLength > 80
          ) {
            otherDocCount += bucket.doc_count;
            continue;
          }

          usefulExamples.push(example);
          usefulExamplesStringLength += example.length;
          usefulExamplesDocCount += bucket.doc_count;
        }

        if (usefulExamples.length === 0) {
          return;
        }

        if (buckets.length === 2 && field_key.endsWith("_boolean")) {
          // No point in describing typical boolean fields
          return;
        }

        const introductoryWord =
          otherDocCount === 0
            ? "only" // This value list is exhaustive
            : 2 * otherDocCount < usefulExamplesDocCount
            ? "mostly" // These values represent the majority
            : "e.g."; // All other cases

        acc[field_key] = `${introductoryWord} ${usefulExamples.join(", ")}`;
      } else {
        const percentiles =
          term_or_percentile as SamplingAggregationPercentiles;
        const sortedValues = Object.entries(percentiles.values)
          .map(([key, value]) => [parseFloat(key), value])
          .sort((a, b) => a[0] - b[0]);
        if (
          sortedValues.length >= 2 &&
          sortedValues[0][0] < 25 &&
          sortedValues[1][0] > 75 &&
          sortedValues[0][1] !== null &&
          sortedValues[1][1] !== null
        ) {
          const lowerValue = humanizeValue(sortedValues[0][1], field_key);
          const upperValue = humanizeValue(sortedValues[1][1], field_key);
          if (lowerValue === upperValue) {
            acc[field_key] = `mostly ${lowerValue}`;
          } else {
            acc[field_key] = `mostly ${lowerValue} to ${upperValue}`;
          }
        }
      }
    } catch (e) {
      console.error(
        "Error parsing sampling aggregation results",
        e,
        field_key,
        term_or_percentile
      );
    }
  });
  return acc;
};

export type ESQLSchema = {
  indexPattern: string;
  knownFields: Field[];
  guide: string;
};

export const deriveSchema = async ({
  apiURL,
  apiKey,
  indexPattern,
  randomSamplingFactor,
}: ESQLDeriveSchemaOptions): Promise<ESQLSchema> => {
  const capabilities = await getJSON(
    `${apiURL}/${indexPattern}/_field_caps`,
    apiKey,
    {
      fields: "*",
      filters: "-metadata",
      include_empty_fields: "false",
    }
  );

  const { indices, fields } = capabilities as CapabilitiesResponse;

  const knownFields = parseFieldCapabilities(fields);
  knownFields.sort((a, b) => a.name.localeCompare(b.name));
  const aggregationRequest = createTermsAggregationRequest(
    knownFields,
    randomSamplingFactor
  );

  let examples: Record<string, string> = {};
  if (aggregationRequest !== null) {
    const termResults = (await postJSON(
      `${apiURL}/${indexPattern}/_search`,
      apiKey,
      aggregationRequest
    )) as SamplingAggregationsResponse;
    examples = parseSamplingAggregationResults(termResults);
  }

  let guide = `# Schema for the index pattern "${indexPattern}"\n\n`;

  guide +=
    `## Indices\n\n` + indices.map((index) => `* ${index}`).join("\n") + "\n\n";
  guide += `## Fields\n\nHere is the combined list of fields in these indices, their type and most common values:\n\n`;

  guide += knownFields
    .map(
      (field) =>
        `* ${field.name}: ${field.type}${
          examples[field.key] ? `, ${examples[field.key]}` : ""
        }`
    )
    .join("\n");

  return {
    guide,
    indexPattern,
    knownFields,
  };
};
