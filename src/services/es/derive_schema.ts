import { ESQLColumnType } from "../../models/esql/esql_types";
import { getJSON, postJSON } from "./base";
import { ESQLDeriveSchemaOptions } from "./types";

interface DeriveSchemaField {
  key: string;
  isAggregatable: boolean;
  isSearchable: boolean;
  name: string;
  type: string;
  indices: string[];
  examples: string[];
}

export type ESQLSchema = {
  indexPattern: string;
  knownFields: DeriveSchemaField[];
  guide: string;
  initialESQL: string;
  initialActions: DeriveSchemaSortAction[];
};

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
): DeriveSchemaField[] => {
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
  fields: DeriveSchemaField[],
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

// This could be imported, but let's not create the dependency.
interface DeriveSchemaSortAction {
  action: "sortDesc";
  column: { name: string; type: ESQLColumnType };
}

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

  const metadataFields = ["_id"];
  let initialIndexPattern = indexPattern;

  if (indices.length === 1) {
    initialIndexPattern = indices[0];
  } else {
    metadataFields.push("_index");
  }

  const metadataParameters = metadataFields.join(", ");
  const initialESQL = `FROM ${initialIndexPattern} METADATA ${metadataParameters}`;
  const initialActions: DeriveSchemaSortAction[] = [];

  for (const field of knownFields) {
    if (field.type === "date") {
      if (field.name === "timestamp" || field.name === "@timestamp")
        initialActions.push({
          action: "sortDesc",
          column: {
            name: field.name,
            type: field.type,
          },
        });
    }
  }

  return {
    guide,
    indexPattern,
    knownFields,
    initialESQL,
    initialActions,
  };
};
