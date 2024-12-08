/**
 * Represents an error encountered during the parsing of pseudo-XML.
 *
 * @interface PseudoXMLParserError
 *
 * @property { "TagLeftOpen" } type - The type of error, indicating that a tag was left open.
 * @property { string } tag - The name of the tag that was left open.
 */
interface PseudoXMLParserError {
  type: "TagLeftOpen";
  tag: string;
}

/**
 * Represents a record object where the keys are strings and the values are either strings or arrays of strings.
 */
export type MultivaluedRecord = Record<string, string | string[]>;

/**
 * Interface representing a handler for pseudo-XML parsing events.
 */
export interface PseudoXMLHandler<TagType extends string> {
  /**
   * Called when a start tag is encountered.
   * @param tag - The name of the start tag.
   */
  onOpenTag?: (tag: TagType) => void;

  /**
   * Called when a line is read.
   * @param tag - The name of the tag associated with the line, or null if no tag is associated.
   * @param line - The content of the line.
   */
  onReadLine?: (tag: TagType | null, line: string) => void;

  /**
   * Called when a close tag is encountered.
   * @param tag - The name of the close tag.
   * @param text - The text content within the tag.
   */
  onCloseTag?: (tag: TagType, text: string) => void;

  /**
   * Called when an error occurs during parsing.
   * @param error - The error encountered during parsing.
   */
  onError?: (error: PseudoXMLParserError) => void;
}

/**
 * A streaming parser for a pseudo-XML format that processes lines of text and
 * triggers handler callbacks for start tags, content lines, and end tags.
 *
 * For pseudo-XML, an opening tag must be at the start of the line and the closing
 * tag must be at the end of the line.
 *
 * Usage example:
 * const handler = {
 *    onOpenTag: (tag: string) => console.log(`Start tag: ${tag}`),
 *    onReadLine: (tag: string | null, line: string) =>
 *      console.log(`Read line: ${tag || "none"}: ${line}`),
 *    onCloseTag: (tag: string, text: string) =>
 *      console.log(`Close tag: ${tag}: ${text}`),
 *  };
 *  const parser = new PseudoXMLParser(["field", "eval"], handler);
 *  parser.push("<field> some");
 *  parser.push(" string </field>\n<eval>\n    thi");
 *  parser.push("s can be \nmultiline\n</eval>");
 *  parser.done();
 */
export class PseudoXMLParser<TagType extends string> {
  /**
   * A set of tags that the parser recognizes.
   */
  private tags: Set<TagType>;

  /**
   * An object containing handler callbacks for various parsing events.
   */
  private handler: PseudoXMLHandler<TagType>;

  /**
   * The current tag being processed, or null if no tag is currently open.
   */
  private currentTag: TagType | null = null;

  /**
   * A buffer that accumulates chunks on the current line, excluding newlines.
   */
  private buffer = "";

  /**
   * A Accumulated full text provided to the parser. Good for debugging.
   */
  private fullText = "";

  /**
   * An array of strings representing the lines of content within the current tag.
   */
  private currentLines: string[] = [];

  /**
   * Constructs a new PseudoXMLParser.
   *
   * @param tags - An array of tag names that the parser should recognize.
   * @param handler - An object containing handler callbacks for parsing events.
   */
  constructor(tags: TagType[], handler: PseudoXMLHandler<TagType>) {
    this.tags = new Set(tags);
    this.handler = handler;
  }

  /**
   * Processes a single line of text, triggering handler callbacks as necessary.
   *
   * @param line - The line of text to process.
   */
  private processLine(line: string) {
    let start = 0;
    let end = line.length;
    let willCloseTag = false;

    if (this.currentTag === null && line.startsWith("<")) {
      for (const tag of this.tags) {
        const openTag = `<${tag}>`;
        if (line.startsWith(openTag)) {
          this.currentTag = tag;
          this.currentLines = [];
          if (this.handler.onOpenTag) {
            this.handler.onOpenTag(tag);
          }
          start = openTag.length;
          break;
        }
      }
    }

    if (this.currentTag != null) {
      const closeTag = `</${this.currentTag}>`;
      if (line.endsWith(closeTag)) {
        end = -closeTag.length;
        willCloseTag = true;
      }
    }

    const content = line.slice(start, end);
    if (this.handler.onReadLine) {
      this.handler.onReadLine(this.currentTag, content);
    }
    if (this.handler.onCloseTag) {
      this.currentLines.push(content);
    }

    if (willCloseTag && this.currentTag) {
      if (this.handler.onCloseTag) {
        this.handler.onCloseTag(this.currentTag, this.currentLines.join("\n"));
      }
      this.currentTag = null;
      this.currentLines = [];
    }
  }

  /**
   * Processes a chunk of text, splitting it into lines and processing each line.
   *
   * @param chunk - The chunk of text to process.
   */
  push(chunk: string) {
    this.fullText += chunk;

    if (chunk.includes("\n")) {
      const bufferLines = (this.buffer + chunk).split("\n");
      this.buffer = bufferLines.pop() || "";
      for (const line of bufferLines) {
        this.processLine(line);
      }
    } else {
      this.buffer += chunk;
    }
  }

  /**
   * Indicates that the parser has finished processing input and triggers any
   * necessary cleanup or error handling.
   */
  done() {
    this.processLine(this.buffer);
    if (this.currentTag) {
      if (this.handler.onError) {
        this.handler.onError({ type: "TagLeftOpen", tag: this.currentTag });
      }
      if (this.handler.onCloseTag) {
        this.handler.onCloseTag(this.currentTag, this.currentLines.join("\n"));
      }
    }
  }

  /**
   * Returns the full text provided to the parser.
   */
  getFullText() {
    return this.fullText;
  }
}

/**
 * Converts an array of string pairs into a pseudo-XML string.
 *
 * @param pairs - An array of tuples where each tuple contains a tag and its corresponding text content.
 * @param tags - An array of tags to be used in the pseudo-XML. (Currently unused in the function)
 * @returns A string representing the pseudo-XML format of the provided pairs.
 */
export const pairsToPseudoXML = (pairs: [string, string][]): string => {
  return pairs.map(([tag, text]) => `<${tag}>${text}</${tag}>`).join("\n");
};

/**
 * Converts a pseudo-XML string into an array of tag-text pairs.
 *
 * @param text - The pseudo-XML string to be parsed.
 * @param tags - An array of tags to be recognized by the parser.
 * @returns An array of tuples where each tuple contains a tag and its corresponding text content.
 */
export const pseudoXMLToPairs = (
  text: string,
  tags: string[]
): [string, string][] => {
  const pairs: [string, string][] = [];
  const handler = {
    onCloseTag: (tag: string, text: string) => {
      pairs.push([tag, text]);
    },
  };

  const parser = new PseudoXMLParser(tags, handler);
  parser.push(text);
  parser.done();

  return pairs;
};

/**
 * Converts a record object to a pseudo-XML string representation using the provided tags.
 *
 * @param record - An object where the keys are strings and the values are either strings or arrays of strings.
 * @param tags - An array of strings representing the tags to be used in the pseudo-XML output.
 * @returns A string representing the pseudo-XML format of the record.
 *
 * @example
 * ```typescript
 * const record = {
 *   name: "John Doe",
 *   hobbies: ["reading", "swimming"]
 * };
 * const tags = ["name", "hobbies"];
 * const result = recordToPseudoXML(record, tags);
 * console.log(result);
 * // Output:
 * // <name>John Doe</name>
 * // <hobbies>reading</hobbies>
 * // <hobbies>swimming</hobbies>
 * ```
 */
export const recordToPseudoXML = (
  record: MultivaluedRecord,
  tags: string[]
): string => {
  return pairsToPseudoXML(
    tags.flatMap((key): [string, string][] => {
      if (key in record) {
        const value = record[key];
        if (Array.isArray(value)) {
          return value.map((v) => [key, v]);
        } else {
          return [[key, value]];
        }
      } else {
        return [];
      }
    })
  );
};

/**
 * Converts a pseudo-XML string into a record object where the keys are tag names
 * and the values are the text content associated with those tags. If a tag appears
 * multiple times, the values are stored in an array.
 *
 * @param text - The pseudo-XML string to be parsed.
 * @param tags - An array of tag names to be recognized and processed.
 * @returns A record object with tag names as keys and their corresponding text content as values.
 */
export const pseudoXMLToRecord = (
  text: string,
  tags: string[]
): MultivaluedRecord => {
  const record: MultivaluedRecord = {};

  pseudoXMLToPairs(text, tags).forEach(([tag, text]) => {
    if (Array.isArray(record[tag])) {
      record[tag].push(text);
    } else if (record[tag]) {
      record[tag] = [record[tag], text];
    } else {
      record[tag] = text;
    }
  });

  return record;
};
