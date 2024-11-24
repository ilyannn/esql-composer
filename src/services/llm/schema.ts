import { MultivaluedRecord, recordToPseudoXML } from "./pseudo-xml";
import { FieldInfo } from "./types";

class Adapter<InputType extends MultivaluedRecord, OutputType extends MultivaluedRecord> {
  private inputSchema: string[];
  private outputSchema: string[];

  constructor(inputSchema: string[], outputSchema: string[]) {
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;

    const inputSet = new Set(this.inputSchema);
    const outputSet = new Set(this.outputSchema);

    if (inputSet.size !== this.inputSchema.length) {
      throw new Error("Duplicate input schema fields");
    }
    if (outputSet.size !== this.outputSchema.length) {
      throw new Error("Duplicate output schema fields");
    }
    if (inputSet.intersection(outputSet).size > 0) {
      throw new Error("Input and output schema fields overlap");
    }
  }

  public formatInput(input: InputType): string {
    return recordToPseudoXML(input, this.inputSchema);
  }

  public formatOutput(output: OutputType): string {
    return recordToPseudoXML(output, this.outputSchema);
  }

  public formatExamples(examples: (InputType & OutputType)[]): string {
    return examples
      .map((example) => [
        "<example>",
        "<input>",
        this.formatInput(example),
        "</input>",
        "<output>",
        this.formatOutput(example),
        "</output>",
        "</example>",
      ])
      .join("\n");
  }
}

export const ESQLEvalInputSchema = ["task"];
export type ESQLEvalOutputTag = "field" | "expr" | "comment";
export const ESQLEvalOutputSchema: ESQLEvalOutputTag[] = ["field", "expr", "comment"];

export interface ESQLEvalInput extends MultivaluedRecord {
  task: string;
}

export interface ESQLEvalOutput extends MultivaluedRecord {
  field: string;
  expr: string;
  comment?: string;
}

class ESQLEvalAdapter extends Adapter<ESQLEvalInput, ESQLEvalOutput> {
  constructor() {
    super(ESQLEvalInputSchema, ESQLEvalOutputSchema);
  }

  public formatContext(options: { esqlInput: string; field: FieldInfo }): string {
    const { field, esqlInput } = options;

    const exampleText =
      field.examples.length > 0 ? `, example: ${field.examples[0]}` : "";
    const source = `${field.name} (type: ${field.type}${exampleText})`;
    const esql = esqlInput.trim() + "\n| EVAL ";

    return recordToPseudoXML(
      {
        esql,
        source,
      },
      ["esql", "source"]
    );
  }
}

export const evalAdapter = new ESQLEvalAdapter();
