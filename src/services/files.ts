import axios from "axios";

/**
 * Loads the content of a file from the given URL.
 *
 * Note that no actual work is done until the promise is resolved.
 *
 * @param url - The URL of the file to load. If null, an empty string is returned.
 * @returns A promise that resolves to the content of the file as a string.
 */
export const loadFile = (url: string | null): Promise<string> => {
  if (!url) {
    return Promise.resolve("");
  }

  return new Promise<string>((resolve, reject) => {
    axios
      .get<string>(url)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
