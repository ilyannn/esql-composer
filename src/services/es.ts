const ELASTICSEARCH_HOST = process.env['REACT_APP_ELASTICSEARCH_HOST'];
const ELASTICSEARCH_API_KEY = process.env['REACT_APP_ELASTICSEARCH_API_KEY'];

interface ESQLQueryOptions {
  query: string;
}

export interface Column {
    name: string;
    type: string;
}

export interface TableData {
    columns: Column[];
    values: Array<Array<string | number |null>>;
}

export const performESQLQuery = async ({
  query,
}: ESQLQueryOptions): Promise<any> => {
  if (!ELASTICSEARCH_HOST || !ELASTICSEARCH_API_KEY) {
    throw new Error("Elasticsearch configuration is missing");
  }

  try {
    const response = await fetch(`${ELASTICSEARCH_HOST}/_query`, {
      method: "POST",
      headers: [
        ["Authorization", `ApiKey ${ELASTICSEARCH_API_KEY}`],
        ["Content-Type", "application/vnd.elasticsearch+json"],
        ["Accept", "application/vnd.elasticsearch+json"],
      ],
      body: JSON.stringify({ query }),
    });
    const data = await response.json() as TableData;
    return data;
} catch (error) {
    console.error("Error performing ES|QL request:", error);
    throw error;
  }
};
