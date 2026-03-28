const resolveAssetURL = (assetPath: string): string => {
  if (typeof window === "undefined") {
    return assetPath;
  }

  return new URL(assetPath, window.location.href).toString();
};

const fetchAsset = async (assetPath: string): Promise<Response> => {
  const response = await fetch(resolveAssetURL(assetPath));

  if (!response.ok) {
    throw new Error(
      `Failed to load ${assetPath}: ${response.status} ${response.statusText}`,
    );
  }

  return response;
};

export const fetchTextAsset = async (assetPath: string): Promise<string> => {
  const response = await fetchAsset(assetPath);
  return response.text();
};

export const fetchJsonAsset = async <T>(assetPath: string): Promise<T> => {
  const response = await fetchAsset(assetPath);
  return response.json() as Promise<T>;
};
