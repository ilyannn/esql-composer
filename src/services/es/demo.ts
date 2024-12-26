import axios from "axios";
import { ESQLChainAction } from "../../models/esql/ESQLChain";
import { CreateIndexParams } from "./indices";

export interface MissingDemoContext {
  prompt(text: string): Promise<boolean>;
  createIndex: (params: CreateIndexParams) => Promise<void>;
  info: (text: string) => void;
}

export interface DemoItem {
  title: string;
  index: string;
  initialActions?: ESQLChainAction[];
  missingProvider: MissingDemoProvider;
}

interface MissingDemoProvider {
  (item: DemoItem, context: MissingDemoContext): Promise<void>;
}

const kibanaSamplesMissingProvider: MissingDemoProvider = async (
  { index },
  { info },
) => info(`Please use Kibana to install the sample index "${index}"`);

const esqlFunctionsMissingProvider: MissingDemoProvider = async (
  { index },
  { info },
) => info(`Installation of the functions index is not yet implemented`);

const esqlShapesMissingProvider: MissingDemoProvider = async (
  { index },
  { prompt, createIndex },
) => {
  const confirmed = await prompt(
    `The index "${index}" is not available. Would you like to create it from sample shape data? Note: make sure PUT requests are allowed by the CORS rules.`,
  );

  if (confirmed) {
    const params = await axios.get("demo-shapes.json");
    await createIndex(params.data);
  }
};

export const DEMO_ITEMS: DemoItem[] = [
  {
    title: "Sample Data - Flights",
    index: "kibana_sample_data_flights",
    initialActions: [
      {
        action: "sortDesc",
        column: {
          name: "timestamp",
          type: "date",
        },
      },
      {
        action: "rename",
        column: {
          name: "AvgTicketPrice",
          type: "double",
        },
        newName: "AvgTicketPrice (USD)",
      },
    ],
    missingProvider: kibanaSamplesMissingProvider,
  },
  {
    title: "Sample Data - E-Commerce",
    index: "kibana_sample_data_ecommerce",
    initialActions: [
      {
        action: "sortDesc",
        column: {
          name: "order_date",
          type: "date",
        },
      },
    ],
    missingProvider: kibanaSamplesMissingProvider,
  },
  {
    title: "ES|QL Functions",
    index: "esql-functions",
    initialActions: [
      {
        action: "sortAsc",
        column: {
          name: "ES|QL Function",
          type: "keyword",
        },
      },
    ],
    missingProvider: esqlFunctionsMissingProvider,
  },
  {
    title: "Shape Samples",
    index: "esql-shapes",
    missingProvider: esqlShapesMissingProvider,
  },
] as const;
