// This implements the subset of the Elasticsearch Query Language (ES|QL)
// data that is used in the visual composer application.

import { stat } from "fs";
import { ESQLColumn } from "./esql_types";

import { ESQLSentinelOtherValues, esqlTypeToClass } from "./esql_types";

import {
  BlockHasStableId,
  DropBlock,
  ESQLBlock,
  esqlBlockToESQL,
  EvalBlock,
  EvalExpression,
  FilterValue,
  KeepBlock,
  OrderItem,
  RenameBlock,
  SortBlock,
} from "./ESQLBlock";
import { statisticsEntries, ValueStatistics } from "./ValueStatistics";

export type ESQLChain = (ESQLBlock & BlockHasStableId)[];

export const esqlChainAddToString = (
  existingESQL: string,
  chain: ESQLChain
): string => {
  const chunks = chain.map(esqlBlockToESQL).filter((block) => block !== null);
  return [existingESQL.trimEnd(), ...chunks].join("\n| ");
};

interface ESQLChainSimpleAction {
  action: "keep" | "limit";
}

interface ESQLColumnBaseAction {
  action: string;
  column: ESQLColumn;
}

interface ESQLChainEvalAction {
  action: "eval";
  sourceField: string | null;
  expressions: EvalExpression[];
}

interface ESQLColumnSimpleAction extends ESQLColumnBaseAction {
  action: "drop" | "sortAsc" | "sortDesc";
}

interface ESQLColumnRenameAction extends ESQLColumnBaseAction {
  action: "rename";
  newName: string;
}

interface ESQLColumnFilterAction extends ESQLColumnBaseAction {
  action: "filter";
  stats: ValueStatistics;
}

export type ESQLColumnAction =
  | ESQLColumnSimpleAction
  | ESQLColumnRenameAction
  | ESQLColumnFilterAction;

export type ESQLChainAction =
  | ESQLChainSimpleAction
  | ESQLColumnAction
  | ESQLChainEvalAction;

interface FindUpdatePointResult {
  updatePoint: number;
  replace: boolean;
}

// Can this action update this block?
const canActOnThisBlock = (
  action: ESQLChainAction,
  block: ESQLBlock
): boolean => {
  switch (action.action) {
    case "limit":
      return block.command === "LIMIT";
    case "keep":
      return block.command === "KEEP";
    case "drop":
      return block.command === "DROP" || block.command === "KEEP";
    case "sortAsc":
    case "sortDesc":
      return block.command === "SORT";
    case "filter":
      return (
        block.command === "WHERE" && block.field.name === action.column.name
      );
    case "rename":
      return block.command === "RENAME";
    default:
      return false;
  }
};

// Can this action bubble over this block?
const canBubbleOverBlock = (
  action: ESQLChainAction,
  block: ESQLBlock
): boolean => {
  if (block.command === "LIMIT" && action.action !== "limit") {
    return true;
  }
  switch (action.action) {
    case "sortAsc":
    case "sortDesc":
    case "filter":
    case "eval":
      return block.command === "DROP" || block.command === "KEEP";
  }
  return false;
};

const findUpdatePoint = (
  action: ESQLChainAction,
  chain: ESQLChain
): FindUpdatePointResult => {
  for (let p = chain.length - 1; p >= 0; p--) {
    if (canActOnThisBlock(action, chain[p])) {
      return { updatePoint: p, replace: true };
    }
    if (canBubbleOverBlock(action, chain[p])) {
      continue;
    }
    // Can't do anything, insert new block after this one.
    return { updatePoint: p + 1, replace: false };
  }
  return { updatePoint: 0, replace: false };
};

const blockUpdateForSort = (
  prevBlock: SortBlock | null,
  orderItem: OrderItem
): SortBlock => {
  if (prevBlock) {
    const prevOrders = prevBlock.order.filter(
      (o) => o.field !== orderItem.field
    );
    return { ...prevBlock, order: [orderItem, ...prevOrders] };
  }
  return { command: "SORT", order: [orderItem] };
};

const blockUpdateForDrop = (
  prevBlock: DropBlock | KeepBlock | null,
  field: string
): DropBlock | KeepBlock => {
  if (!prevBlock) {
    return { command: "DROP", fields: [field] };
  }
  if (prevBlock.command === "DROP") {
    const newFields = [...prevBlock.fields.filter((f) => f !== field), field];
    return { ...prevBlock, fields: newFields };
  }
  const newFields = prevBlock.fields.filter((f) => f !== field);
  return { ...prevBlock, fields: newFields };
};

const blockUpdateForRename = (
  prevBlock: RenameBlock | null,
  oldName: string,
  newName: string
): RenameBlock => {
  if (prevBlock) {
    const map = { ...prevBlock.map, [oldName]: newName };
    return { ...prevBlock, map };
  }
  return { command: "RENAME", map: { [oldName]: newName } };
};

const blockUpdateForEval = (
  prevBlock: EvalBlock | null,
  expressions: EvalExpression[]
): EvalBlock => {
  return prevBlock
    ? { ...prevBlock, expressions: [...prevBlock.expressions, ...expressions] }
    : { command: "EVAL", expressions };
};

class ChainActionError extends Error {
  action: ESQLChainAction;

  constructor(message: string, action: ESQLChainAction) {
    super(message);
    this.action = action;
    this.name = "ChainActionError";
  }
}

type BubbleDownParams = null | {
  sourceField: string | null;
  newFields: string[];
};

const bubbleDown = (
  params: BubbleDownParams,
  afterBlocks: ESQLChain
): ESQLChain => {
  if (!params) {
    return afterBlocks;
  }

  let { sourceField, newFields } = params;

  const blocks: ESQLChain = [];
  for (const block of afterBlocks) {
    switch (block.command) {
      case "DROP":
        const currentNewFields = new Set(newFields);
        const fields = block.fields.filter((f) => !currentNewFields.has(f));
        blocks.push({ ...block, fields });
        break;

      case "KEEP":
        let fieldsToKeep = block.fields;
        for (const newField of newFields) {
          if (!fieldsToKeep.includes(newField)) {
            let insertIndex = sourceField
              ? fieldsToKeep.indexOf(sourceField)
              : -1;
            console.log("fieldsToKeep", fieldsToKeep);
            console.log("sourceField", sourceField);
            console.log("insertIndex", insertIndex);
            fieldsToKeep = [
              ...fieldsToKeep.slice(0, insertIndex + 1),
              newField,
              ...fieldsToKeep.slice(insertIndex + 1),
            ];
          }
        }
        blocks.push({ ...block, fields: fieldsToKeep });
        break;

      case "RENAME":
        const map = block.map;
        if (sourceField && sourceField in map) {
          sourceField = map[sourceField];
        }
        newFields = newFields.map((f) => (f in map ? map[f] : f));
        break;

      default:
        blocks.push(block);
        break;
    }
  }
  return blocks;
};

const provideValues = (stats: ValueStatistics): FilterValue[] => {
  const entries = statisticsEntries(stats);
  entries.sort((a, b) => b[1] - a[1]);

  const entryValues: FilterValue[] = entries.map(([value, count]) => ({
    value,
    included: true,
  }));

  return [...entryValues, { value: ESQLSentinelOtherValues, included: true }];
};

export const createInitialChain = (): ESQLChain => {
  const { chain } = performChainAction([], { action: "limit" }, []);
  return chain;
};

let globalNextStableBlockId = 0;

const assignBlockId = (block: ESQLBlock): ESQLBlock & BlockHasStableId => {
  if (block.stableId) {
    return block as ESQLBlock & BlockHasStableId;
  }
  return {
    ...block,
    stableId: `${block.command}-${globalNextStableBlockId++}`,
  };
};

export const performChainAction = (
  chain: ESQLChain,
  action: ESQLChainAction,
  knownFields: string[]
): { chain: ESQLChain; upsertedIndex: number } => {
  const { updatePoint, replace } = findUpdatePoint(action, chain);
  const prevBlock = replace ? chain[updatePoint] : null;
  const beforeChain = chain.slice(0, updatePoint);
  const afterChain = chain.slice(updatePoint + (replace ? 1 : 0));
  let bubbleDownParams: BubbleDownParams = null;
  let newBlock: ESQLBlock | null = null;

  switch (action.action) {
    case "limit":
      newBlock = prevBlock ?? { command: "LIMIT", limit: 20 };
      break;

    case "keep":
      newBlock = { command: "KEEP", fields: knownFields };
      break;

    case "drop":
      newBlock = blockUpdateForDrop(
        prevBlock as DropBlock | KeepBlock | null,
        action.column.name
      );
      break;

    case "sortAsc":
      newBlock = blockUpdateForSort(prevBlock as SortBlock | null, {
        field: action.column.name,
        sort_class: esqlTypeToClass(action.column.type),
        asc: true,
      });
      break;

    case "sortDesc":
      newBlock = blockUpdateForSort(prevBlock as SortBlock | null, {
        field: action.column.name,
        sort_class: esqlTypeToClass(action.column.type),
        asc: false,
      });
      break;

    case "filter":
      newBlock = {
        command: "WHERE",
        field: action.column,
        values: provideValues(action.stats),
        localStats: action.stats,
        topStatsRetrieved: 0,
        topStats: undefined,
      };
      break;

    case "rename":
      if (knownFields.includes(action.newName)) {
        throw new ChainActionError("Field name already exists", action);
      }
      newBlock = blockUpdateForRename(
        prevBlock as RenameBlock | null,
        action.column.name,
        action.newName
      );
      break;

    case "eval":
      newBlock = blockUpdateForEval(
        prevBlock as EvalBlock | null,
        action.expressions
      );
      bubbleDownParams = {
        sourceField: action.sourceField,
        newFields: action.expressions.map((e) => e.field),
      };
      break;
  }
  const updatedAfterChain = bubbleDown(bubbleDownParams, afterChain);
  const newChain = [
    ...beforeChain,
    assignBlockId(newBlock),
    ...updatedAfterChain,
  ];
  return { chain: newChain, upsertedIndex: updatePoint };
};
