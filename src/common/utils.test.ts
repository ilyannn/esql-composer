import { makeUnique } from "./utils";

describe("makeUnique", () => {
  it("should return an array with unique strings", () => {
    const input = ["apple", "banana", "apple", "orange", "banana", "apple"];
    const result = makeUnique(input);
    expect(result).toEqual([
      "apple",
      "banana",
      "apple-1",
      "orange",
      "banana-1",
      "apple-2",
    ]);
  });

  it("should handle an array with no duplicates", () => {
    const input = ["apple", "banana", "orange"];
    const result = makeUnique(input);
    expect(result).toEqual(["apple", "banana", "orange"]);
  });

  it("should handle an empty array", () => {
    const input: string[] = [];
    const result = makeUnique(input);
    expect(result).toEqual([]);
  });

  it("should handle an array with all identical strings", () => {
    const input = ["apple", "apple", "apple"];
    const result = makeUnique(input);
    expect(result).toEqual(["apple", "apple-1", "apple-2"]);
  });

  it("should handle the case where updated string is not unique either", () => {
    const input = ["apple", "apple", "apple-1"];
    const result = makeUnique(input);
    expect(result).toEqual(["apple", "apple-1", "apple-1-1"]);
  });

  it("should handle an array with special characters", () => {
    const input = ["apple!", "apple!", "apple!"];
    const result = makeUnique(input);
    expect(result).toEqual(["apple!", "apple!-1", "apple!-2"]);
  });
});
