const addToArray = (arr: any[], value: any) => {
  if (Array.isArray(value)) {
    arr.push(...value);
  } else {
    arr.push(value);
  }
};

/**
 * Combines two Elasticsearch JSON objects by merging their properties.
 * Arrays are created as needed and nested objects are merged recursively.
 *
 * @param a - The first Elasticsearch JSON object.
 * @param b - The second Elasticsearch JSON object.
 * @returns The combined Elasticsearch JSON object.
 */
export const deeplyMergeElasticsearchJSONs = (
  a: Record<string, any>,
  b: Record<string, any>
) => {
  const result = { ...a };

  Object.entries(b).forEach(([key, value]) => {
    if (key in result) {
      if (Array.isArray(result[key])) {
        addToArray(result[key], value);
      } else if (
        typeof result[key] === "object" &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        result[key] = deeplyMergeElasticsearchJSONs(result[key], value);
      } else {
        result[key] = [result[key]];
        addToArray(result[key], value);
      }
    } else {
      result[key] = value;
    }
  });

  return result;
};
/**
 * Trims the provided API key and ensures it is Base64 encoded.
 *
 * @param apiKey - The API key to be checked and possibly encoded.
 * @returns The Base64 encoded API key or the trimmed original if it was already encoded.
 */
export const ensureBase64Encoded = (apiKey: string): string => {
  const trimmed = apiKey.trim();
  try {
    atob(trimmed);
  } catch (e) {
    return btoa(trimmed);
  }

  return trimmed;
};
