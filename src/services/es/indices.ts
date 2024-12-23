import { ESAPIOptions } from "./types";
import { putJSON, postNDJSON, headRequest } from "./base";

export interface CreateIndexParams {
  info: { mappings: { properties: any } };
  data: any[];
}

export interface ESIndexOptions extends ESAPIOptions {
  index: string;
}

export interface ESQLCreateIndexOptions extends ESIndexOptions {
  params: CreateIndexParams;
}

const prepareForBulk = (data: any[]) => {
  return data.flatMap((doc) => [{ index: {} }, doc]);
};

export const createIndex = async ({
  apiURL,
  apiKey,
  index,
  params: { info, data },
}: ESQLCreateIndexOptions) => {
  await putJSON(`${apiURL}/${index}`, apiKey, info);
  await postNDJSON(`${apiURL}/${index}/_bulk`, apiKey, prepareForBulk(data));
};

export const checkIndexExists = async ({
  apiURL,
  apiKey,
  index,
}: ESIndexOptions): Promise<boolean> => {
  const response = await headRequest(`${apiURL}/${index}`, apiKey);
  return response.ok;
};
