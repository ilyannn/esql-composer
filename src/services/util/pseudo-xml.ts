// #!/usr/bin/env ts-node

interface PseudoXMLParserError {
  type: "TagLeftOpen";
  tag: string;
}

export interface PseudoXMLHandler {
  onStartTag?: (tag: string) => void;
  onReadLine?: (tag: string | null, line: string) => void;
  onCloseTag?: (tag: string, text: string) => void;
  onError?: (error: PseudoXMLParserError) => void;
}

export class PseudoXMLParser {
  private tags: Set<string>;
  private handler: PseudoXMLHandler;

  // Current state
  private currentTag: string | null = null;
  private buffer = ""; // accumulates chunks on the current line, does not contain newlines
  private currentLines: string[] = [];

  constructor(tags: string[], handler: PseudoXMLHandler) {
    this.tags = new Set(tags);
    this.handler = handler;
  }

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
          if (this.handler.onStartTag) {
            this.handler.onStartTag(tag);
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

  done() {
    this.processLine(this.buffer);
    if (this.currentTag) {
      if (this.handler.onError) {
        this.handler.onError({type: "TagLeftOpen", tag: this.currentTag});
      }
      if (this.handler.onCloseTag) {
        this.handler.onCloseTag(this.currentTag, this.currentLines.join("\n"));
      }
    }
  }

  push(chunk: string) {
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
}
