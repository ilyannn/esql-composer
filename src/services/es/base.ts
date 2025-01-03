import { QueryAPIError } from "./types";
import { ensureBase64Encoded } from "./utils";

const fetchSomething = (
  method: string,
  apiKey: string,
  url: string,
  body: string | null,
  accept: string,
): Promise<Response> => {
  return fetch(url, {
    method,
    headers: [
      ["Authorization", `ApiKey ${ensureBase64Encoded(apiKey)}`],
      ["Content-Type", "application/vnd.elasticsearch+json"],
      ["Accept", accept],
    ],
    body,
  });
};

const fetchJSON = async (
  method: string,
  apiKey: string,
  url: string,
  body: string | null,
): Promise<object> => {
  const response = await fetchSomething(
    method,
    apiKey,
    url,
    body,
    "application/vnd.elasticsearch+json",
  );

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

export const headRequest = (url: string, apiKey: string): Promise<Response> =>
  fetch(url, {
    method: "HEAD",
    headers: {
      Authorization: `ApiKey ${ensureBase64Encoded(apiKey)}`,
    },
  });

export const postJSON = async (
  url: string,
  apiKey: string,
  bodyObject: object,
  paramObject: Record<string, string> | null = null,
): Promise<object> => {
  const newURL = paramObject
    ? `${url}?${new URLSearchParams(paramObject)}`
    : url;
  return await fetchJSON("POST", apiKey, newURL, JSON.stringify(bodyObject));
};

export const postNDJSON = async (
  url: string,
  apiKey: string,
  bodyObjects: object[],
  paramObject: Record<string, string> | null = null,
): Promise<object> => {
  const body = bodyObjects.map((obj) => `${JSON.stringify(obj)}\n`).join("");
  const newURL = paramObject
    ? `${url}?${new URLSearchParams(paramObject)}`
    : url;
  return await fetchJSON("POST", apiKey, newURL, body);
};

export const postJSONAcceptFormat = async (
  url: string,
  apiKey: string,
  bodyObject: object,
  accept: string,
): Promise<Response> =>
  fetchSomething("POST", apiKey, url, JSON.stringify(bodyObject), accept);

export const putJSON = (
  url: string,
  apiKey: string,
  bodyObject: object,
): Promise<object> => fetchJSON("PUT", apiKey, url, JSON.stringify(bodyObject));

export const getJSON = async (
  url: string,
  apiKey: string,
  paramObject: Record<string, string> | null = null,
): Promise<object> => {
  const newURL = paramObject
    ? `${url}?${new URLSearchParams(paramObject)}`
    : url;
  return await fetchJSON("GET", apiKey, newURL, null);
};
