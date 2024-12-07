import {
  ESQLAtomRawValue,
  ESQLValueFalse,
  ESQLValueNull,
  ESQLValueTrue,
  type ESQLAtomValue,
} from "./esql_types";

export interface ValueStatistics {
  totalCount: number;
  nullCount: number;
  trueCount: number;
  falseCount: number;
  stringCounts: Record<string, number>;
  numberCounts: Record<number, number>;
}

export const countRawValues = (values: ESQLAtomRawValue[]): ValueStatistics => {
  const stats: ValueStatistics = {
    totalCount: values.length,
    nullCount: values.filter((v) => v === null).length,
    trueCount: values.filter((v) => v === true).length,
    falseCount: values.filter((v) => v === false).length,
    stringCounts: {},
    numberCounts: {},
  };

  for (const value of values) {
    if (typeof value === "string") {
      stats.stringCounts[value] = (stats.stringCounts[value] || 0) + 1;
    } else if (typeof value === "number") {
      stats.numberCounts[value] = (stats.numberCounts[value] || 0) + 1;
    }
  }

  return stats;
};

export const countRawValuesWithCount = (
  values_counts: [ESQLAtomRawValue, number][]
): ValueStatistics => {
  const stats: ValueStatistics = {
    totalCount: values_counts.reduce((a, b) => a + b[1], 0),
    nullCount: 0,
    trueCount: 0,
    falseCount: 0,
    stringCounts: {},
    numberCounts: {},
  };

  for (const [value, count] of values_counts) {
    if (typeof value === "string") {
      stats.stringCounts[value] = (stats.stringCounts[value] || 0) + count;
    } else if (typeof value === "number") {
      stats.numberCounts[value] = (stats.numberCounts[value] || 0) + count;
    } else if (value === null) {
      stats.nullCount += count;
    } else if (value === true) {
      stats.trueCount += count;
    } else if (value === false) {
      stats.falseCount += count;
    }
  }

  return stats;
};

export const getValueCount = (
  value: ESQLAtomValue,
  stats: ValueStatistics | undefined
): number => {
  if (stats === undefined) {
    return 0;
  }

  if (value === ESQLValueTrue) {
    return stats.trueCount;
  }
  if (value === ESQLValueFalse) {
    return stats.falseCount;
  }
  if (value === ESQLValueNull) {
    return stats.nullCount;
  }
  if (typeof value === "string") {
    return stats.stringCounts[value] || 0;
  }
  if (typeof value === "number") {
    return stats.numberCounts[value] || 0;
  }
  return 0;
};

export const statisticsEntries = (
  stats: ValueStatistics | undefined
): [ESQLAtomValue, number][] => {
  if (stats === undefined) {
    return [];
  }

  const items: [ESQLAtomValue, number][] = [
    ...Object.entries(stats.stringCounts),
  ];

  if (stats.trueCount > 0) {
    items.push([ESQLValueTrue, stats.trueCount]);
  }

  if (stats.falseCount > 0) {
    items.push([ESQLValueFalse, stats.falseCount]);
  }
   
  if (stats.nullCount > 0) {
    items.push([ESQLValueNull, stats.nullCount]);
  }

  for (const [value, count] of Object.entries(stats.numberCounts)) {
    items.push([Number(value), count]);
  }
 
  return items;
};
