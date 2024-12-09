/**
 * Takes an array of strings and returns a new array where duplicate strings are made unique
 * by appending a suffix with a count.
 *
 * @param strings - The array of strings to be processed.
 * @returns A new array of strings where duplicates are made unique.
 *
 * @example
 * ```typescript
 * const input = ["apple", "banana", "apple", "orange", "banana"];
 * const result = makeUnique(input);
 * console.log(result); // ["apple", "banana", "apple-1", "orange", "banana-1"]
 * ```
 */
export function makeUnique(strings: string[]): string[] {
  const seen: { [key: string]: number } = {};

  return strings.map((str) => {
    let candidate = str;
    while (seen[candidate] !== undefined) {
      candidate = `${candidate}-${++seen[str]}`;
    }
    seen[candidate] = 0;
    return candidate;
  });
}
