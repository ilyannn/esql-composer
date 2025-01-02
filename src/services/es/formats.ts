interface ExportFormatBase {
  id: string;
  accept: string;
  description: string;
  fileExt: string;
  canBeColumnar: boolean;
  canAddPreamble: boolean;
}

interface WithColumnar {
  readonly format: { readonly canBeColumnar: true };
  readonly columnar: boolean;
}

interface WithPreamble {
  readonly format: { readonly canAddPreamble: true };
  readonly addPreamble: boolean;
}

interface WithoutColumnar {
  readonly format: { readonly canBeColumnar: false };
}

interface WithoutPreamble {
  readonly format: { readonly canAddPreamble: false };
}

export type ExportFormatOptions = {
  readonly format: ExportFormatBase;
  readonly columnar: boolean;
  readonly addPreamble: boolean;
};

const HUMAN_READABLE_FORMATS = [
  {
    id: "csv",
    accept: "text/csv",
    description: "Comma-separated values",
    fileExt: ".csv",
    canBeColumnar: false,
    canAddPreamble: false,
  },
  {
    id: "tsv",
    accept: "text/tab-separated-values",
    description: "Tab-separated values",
    fileExt: ".tsv",
    canBeColumnar: false,
    canAddPreamble: false,
  },
  {
    id: "txt",
    accept: "text/plain",
    description: "Text (CLI-like representation)",
    fileExt: ".txt",
    canBeColumnar: false,
    canAddPreamble: false,
  },
  {
    id: "json",
    accept: "application/json",
    description: "JSON",
    fileExt: ".json",
    canBeColumnar: true,
    canAddPreamble: false,
  },
  {
    id: "yaml",
    accept: "application/yaml",
    description: "YAML",
    fileExt: ".yaml",
    canBeColumnar: true,
    canAddPreamble: true,
  },
] as const satisfies ExportFormatBase[];

const BINARY_FORMATS = [
  {
    id: "cbor",
    accept: "application/cbor",
    description: "CBOR binary data format",
    fileExt: ".cbor",
    canBeColumnar: true,
    canAddPreamble: false,
  },
  {
    id: "smile",
    accept: "application/smile",
    description: "Smile binary data format",
    fileExt: ".sml",
    canBeColumnar: true,
    canAddPreamble: false,
  },
] as const satisfies ExportFormatBase[];

export const KNOWN_EXPORT_FORMATS = [
  ...HUMAN_READABLE_FORMATS,
  ...BINARY_FORMATS,
] as const satisfies ExportFormatBase[];

export type ExportFormat = typeof KNOWN_EXPORT_FORMATS[number];