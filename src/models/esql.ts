// This implements the subset of the Elasticsearch Query Language (ES|QL)
// data that is used in the visual composer application.

interface BaseESQLBlock {
  command: string;
  stableId?: string;
}

export interface BlockHasStableId {
  stableId: string;
}

export interface LimitBlock extends BaseESQLBlock {
  command: "LIMIT";
  limit: number | null;
}

export interface KeepBlock extends BaseESQLBlock {
  command: "KEEP";
  fields: string[];
}

export interface DropBlock extends BaseESQLBlock {
  command: "DROP";
  fields: string[];
}

export interface RenameBlock extends BaseESQLBlock {
  command: "RENAME";
  map: { [oldName: string]: string };
}

export interface FilterBlock extends BaseESQLBlock {
  command: "WHERE";
  field: string;
  values: any[];
}

interface EvalExpression {
  field: string;
  expression: string;
}

export interface EvalBlock extends BaseESQLBlock {
  command: "EVAL";
  expressions: EvalExpression[];
}

interface OrderItem {
  field: string;
  asc: boolean;
}

export interface SortBlock extends BaseESQLBlock {
  command: "SORT";
  order: OrderItem[];
}

export type ESQLBlock =
  | EvalBlock
  | LimitBlock
  | KeepBlock
  | DropBlock
  | RenameBlock
  | FilterBlock
  | SortBlock;

const BACKTICK = "`";

// https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-syntax.html
const escape = (name: string): string => {
  if (!/^[a-zA-Z_@]/.test(name) || /[^a-zA-Z0-9_]/.test(name.slice(1))) {
    return `${BACKTICK}${name.replace(
      BACKTICK,
      BACKTICK + BACKTICK
    )}${BACKTICK}`;
  }
  return name;
};

// const unescape = (name: string): string => {
//   if (name.startsWith(BACKTICK) && name.endsWith(BACKTICK)) {
//     return name.slice(1, -1).replace(new RegExp(`${BACKTICK}${BACKTICK}`, "g"), BACKTICK);
//   }
//   return name;
// }

/**
 * Applies a function to a specified field with optional arguments and returns the resulting string.
 *
 * The field names are escaped.
 * 
 * @param func - The name of the function to apply.
 * @param field - The field to which the function will be applied.
 * @param args - Additional arguments to pass to the function.
 * @returns The resulting string after applying the function to the field with the provided arguments.
 */
export const applyFunctionToField = (func: string, field: string, ...args: any[]): string => {
  return `${func}(${escape(field)}, ${args.map((arg) => JSON.stringify(arg)).join(", ")})`;
}

const limitBlockToString = (block: LimitBlock): string | null => {
  if (block.limit === null) {
    return null;
  }
  return `LIMIT ${block.limit}`;
};

const keepBlockToString = (block: KeepBlock): string | null => {
  if (block.fields.length === 0) {
    return null;
  }
  return `KEEP ${block.fields.map(escape).join(", ")}`;
};

const dropBlockToString = (block: DropBlock): string | null => {
  if (block.fields.length === 0) {
    return null;
  }
  return `DROP ${block.fields.map(escape).join(", ")}`;
};

const renameBlockToString = (block: RenameBlock): string | null => {
  if (Object.keys(block.map).length === 0) {
    return null;
  }
  const fields = Object.entries(block.map)
    .map(([oldName, newName]) => `${escape(oldName)} AS ${escape(newName)}`)
    .join(", ");
  return `RENAME ${fields}`;
};

const whereBlockToString = (block: FilterBlock): string | null => {
  if (block.values.length === 0) {
    return null;
  }
  return `WHERE ${escape(block.field)} = ...`;
};

const sortBlockToString = (block: SortBlock): string | null => {
  if (block.order.length === 0) {
    return null;
  }
  const fields = block.order
    .map((field) => `${escape(field.field)}${field.asc ? "" : " DESC"}`)
    .join(", ");
  return `SORT ${fields}`;
};

const evalBlockToString = (block: EvalBlock): string | null => {
  const expressions = block.expressions.filter((e) => e.expression !== "");

  if (expressions.length === 0) {
    return null;
  }
  return (
    "EVAL " +
    expressions
      .map(({ field, expression }) => `${escape(field)} = ${expression}`)
      .join(", ")
  );
};

const esqlBlockToString = (block: ESQLBlock): string | null => {
  switch (block.command) {
    case "EVAL":
      return evalBlockToString(block);
    case "LIMIT":
      return limitBlockToString(block);
    case "KEEP":
      return keepBlockToString(block);
    case "DROP":
      return dropBlockToString(block);
    case "RENAME":
      return renameBlockToString(block);
    case "WHERE":
      return whereBlockToString(block);
    case "SORT":
      return sortBlockToString(block);
  }
};

export type ESQLChain = (ESQLBlock & BlockHasStableId)[];

export const esqlChainAddToString = (
  existingESQL: string,
  chain: ESQLChain
): string => {
  const chunks = chain.map(esqlBlockToString).filter((block) => block !== null);
  return [existingESQL.trimEnd(), ...chunks].join("\n| ");
};

interface ESQLChainSimpleAction {
  action: "keep" | "limit";
}

interface ESQLFieldBaseAction {
  action: string;
  field: string;
}

interface ESQLChainEvalAction {
  action: "eval";
  expressions: EvalExpression[];
}

interface ESQLFieldSimpleAction extends ESQLFieldBaseAction {
  action: "drop" | "sortAsc" | "sortDesc" | "filter";
}

interface ESQLFieldRenameAction extends ESQLFieldBaseAction {
  action: "rename";
  newName: string;
}

export type ESQLFieldAction = ESQLFieldSimpleAction | ESQLFieldRenameAction;
export type ESQLChainAction =
  | ESQLChainSimpleAction
  | ESQLFieldAction
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
      return block.command === "WHERE" && block.field === action.field;
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
        action.field
      );
      break;

    case "sortAsc":
      newBlock = blockUpdateForSort(prevBlock as SortBlock | null, {
        field: action.field,
        asc: true,
      });
      break;

    case "sortDesc":
      newBlock = blockUpdateForSort(prevBlock as SortBlock | null, {
        field: action.field,
        asc: false,
      });
      break;

    case "filter":
      newBlock = { command: "WHERE", field: action.field, values: [] };
      break;

    case "rename":
      if (knownFields.includes(action.newName)) {
        throw new ChainActionError("Field name already exists", action);
      }
      newBlock = blockUpdateForRename(
        prevBlock as RenameBlock | null,
        action.field,
        action.newName
      );
      break;

    case "eval":
      newBlock = blockUpdateForEval(prevBlock as EvalBlock | null, action.expressions);
      break;
  }

  const newChain = [...beforeChain, assignBlockId(newBlock), ...afterChain];
  return { chain: newChain, upsertedIndex: updatePoint };
};
