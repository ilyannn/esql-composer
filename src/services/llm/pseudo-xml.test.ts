import { describe, expect, it } from "@jest/globals";
import {
  PseudoXMLParser,
  pseudoXMLToRecord,
  recordToPseudoXML,
} from "./pseudo-xml";

describe("PseudoXMLParser", () => {
  it("should parse simple single-line tags", () => {
    const results: any[] = [];
    const handler = {
      onOpenTag: (tag: string) => results.push(["start", tag]),
      onReadLine: (tag: string | null, line: string) =>
        results.push(["line", tag, line]),
      onCloseTag: (tag: string, text: string) =>
        results.push(["close", tag, text]),
    };

    const parser = new PseudoXMLParser(["test"], handler);
    parser.push("<test>content</test>");
    parser.done();

    expect(results).toEqual([
      ["start", "test"],
      ["line", "test", "content"],
      ["close", "test", "content"],
    ]);
  });

  it("should parse multi-line tags", () => {
    const results: any[] = [];
    const handler = {
      onOpenTag: (tag: string) => results.push(["start", tag]),
      onReadLine: (tag: string | null, line: string) =>
        results.push(["line", tag, line]),
      onCloseTag: (tag: string, text: string) =>
        results.push(["close", tag, text]),
    };

    const parser = new PseudoXMLParser(["test"], handler);
    parser.push("<test>\n");
    parser.push("line1\n");
    parser.push("line2\n");
    parser.push("</test>");
    parser.done();

    expect(results).toEqual([
      ["start", "test"],
      ["line", "test", ""],
      ["line", "test", "line1"],
      ["line", "test", "line2"],
      ["line", "test", ""],
      ["close", "test", "\nline1\nline2\n"],
    ]);
  });

  it("should work when pushing smaller chunks", () => {
    const results: any[] = [];
    const handler = {
      onOpenTag: (tag: string) => results.push(["start", tag]),
      onReadLine: (tag: string | null, line: string) =>
        results.push(["line", tag, line]),
      onCloseTag: (tag: string, text: string) =>
        results.push(["close", tag, text]),
    };

    const parser = new PseudoXMLParser(["test"], handler);
    const text = "<test>\nline1\nline2\n</test>";

    let chunkSize = 1;
    for (let i = 0; i < text.length; i += chunkSize) {
      chunkSize = (chunkSize % 3) + 1;
      parser.push(text.slice(i, i + chunkSize));
    }
    parser.done();

    expect(results).toEqual([
      ["start", "test"],
      ["line", "test", ""],
      ["line", "test", "line1"],
      ["line", "test", "line2"],
      ["line", "test", ""],
      ["close", "test", "\nline1\nline2\n"],
    ]);
  });

  it("should handle unclosed tags", () => {
    const results: any[] = [];
    const handler = {
      onOpenTag: (tag: string) => results.push(["start", tag]),
      onError: (error: any) => results.push(["error", error.type, error.tag]),
      onCloseTag: (tag: string, text: string) =>
        results.push(["close", tag, text]),
    };

    const parser = new PseudoXMLParser(["test"], handler);
    parser.push("<test>content");
    parser.done();

    expect(results).toEqual([
      ["start", "test"],
      ["error", "TagLeftOpen", "test"],
      ["close", "test", "content"],
    ]);
  });

  it("should ignore unregistered tags", () => {
    const results: any[] = [];
    const handler = {
      onOpenTag: (tag: string) => results.push(["start", tag]),
      onReadLine: (tag: string | null, line: string) =>
        results.push(["line", tag, line]),
    };

    const parser = new PseudoXMLParser(["test"], handler);
    parser.push("<other>content</other>");
    parser.done();

    expect(results).toEqual([["line", null, "<other>content</other>"]]);
  });

  it("should parse multiple registered tags", () => {
    const results: any[] = [];
    const handler = {
      onOpenTag: (tag: string) => results.push(["start", tag]),
      onReadLine: (tag: string | null, line: string) =>
        results.push(["line", tag, line]),
      onCloseTag: (tag: string, text: string) =>
        results.push(["close", tag, text]),
    };

    const parser = new PseudoXMLParser(["field", "eval"], handler);
    const testString = `<field> some string </field>\n<eval>\n    this can be \nmultiline\n</eval>`;

    for (const char of testString) {
      parser.push(char);
    }
    parser.done();

    expect(results).toEqual([
      ["start", "field"],
      ["line", "field", " some string "],
      ["close", "field", " some string "],
      ["start", "eval"],
      ["line", "eval", ""],
      ["line", "eval", "    this can be "],
      ["line", "eval", "multiline"],
      ["line", "eval", ""],
      ["close", "eval", "\n    this can be \nmultiline\n"],
    ]);
  });

  describe("recordToPseudoXML", () => {
    it("should convert record to pseudo-XML", () => {
      const record = {
        field: "value1",
        eval: ["value2", "value3"],
      };
      const tags = ["field", "eval"];
      const result = recordToPseudoXML(record, tags);
      expect(result).toEqual(
        "<field>value1</field>\n<eval>value2</eval>\n<eval>value3</eval>",
      );
    });
  });

  describe("pseudoXMLToRecord", () => {
    it("should convert pseudo-XML to record", () => {
      const text =
        "<field>value1</field>\n<eval>value2</eval>\n<eval>value3</eval>";
      const tags = ["field", "eval"];
      const result = pseudoXMLToRecord(text, tags);
      expect(result).toEqual({
        field: "value1",
        eval: ["value2", "value3"],
      });
    });
  });
});
