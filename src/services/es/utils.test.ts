import { deeplyMergeElasticsearchJSONs } from "./utils";

describe("deeplyMergeElasticsearchJSONs", () => {
  it("should combine two simple Elasticsearch JSON objects", () => {
    const a = { key1: "value1" };
    const b = { key2: "value2" };
    const result = deeplyMergeElasticsearchJSONs(a, b);
    expect(result).toEqual({ key1: "value1", key2: "value2" });
  });

  it("should merge arrays from both objects", () => {
    const a = { key1: ["value1"] };
    const b = { key1: ["value2"] };
    const result = deeplyMergeElasticsearchJSONs(a, b);
    expect(result).toEqual({ key1: ["value1", "value2"] });
  });

  it("should handle non-array values correctly", () => {
    const a = { key1: "value1" };
    const b = { key1: "value2" };
    const result = deeplyMergeElasticsearchJSONs(a, b);
    expect(result).toEqual({ key1: ["value1", "value2"] });
  });

  it("should handle nested objects", () => {
    const a = { key1: { nestedKey1: "nestedValue1" } };
    const b = { key1: { nestedKey2: "nestedValue2" } };
    const result = deeplyMergeElasticsearchJSONs(a, b);
    expect(result).toEqual({
      key1: { nestedKey1: "nestedValue1", nestedKey2: "nestedValue2" },
    });
  });

  it("should handle empty objects", () => {
    const a = {};
    const b = { key1: "value1" };
    const result = deeplyMergeElasticsearchJSONs(a, b);
    expect(result).toEqual({ key1: "value1" });
  });
});
