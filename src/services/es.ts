interface ESQLQueryOptions {
  apiURL: string;
  apiKey: string;
  query: string;
}

export interface Column {
  name: string;
  type: string;
}

export interface TableData {
  columns: Column[];
  values: Array<Array<string | number | null>>;
}

export class QueryAPIError extends Error {
    readonly status: number | undefined;
    readonly isAuthorizationError: boolean;

    constructor(status: number | undefined, error: any) {
        super(JSON.stringify(error, null, 2));

        this.status = status;
        this.isAuthorizationError = status === 401
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
            typeof val === "string" || typeof val === "number" || val === null
        )
    )
  );
}

export const performESQLQuery = async ({
  apiURL,
  apiKey,
  query,
}: ESQLQueryOptions): Promise<TableData> => {
  const response = await fetch(`${apiURL}/_query`, {
    method: "POST",
    headers: [
      ["Authorization", `ApiKey ${apiKey}`],
      ["Content-Type", "application/vnd.elasticsearch+json"],
      ["Accept", "application/vnd.elasticsearch+json"],
    ],
    body: JSON.stringify({ query }),
  });

  const answer = await response.json();

  if ("error" in answer) {
    throw new QueryAPIError(response.status, answer.error);
  }

  if (!response.ok) {
    throw new QueryAPIError(response.status, answer);
  }

  if (!isTableData(answer)) {
    throw new QueryAPIError(undefined, "Invalid format of the response data");
  }

  return answer;
};
