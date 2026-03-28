type YAMLScalar = string | number | boolean | null;

const serializeScalar = (value: YAMLScalar): string => {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return String(value);
};

export const serializeYAMLRecord = (
  record: Record<string, YAMLScalar>,
): string =>
  `${Object.entries(record)
    .map(([key, value]) => `${key}: ${serializeScalar(value)}`)
    .join("\n")}\n`;
