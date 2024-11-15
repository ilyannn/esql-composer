// This implements the subset of the Elasticsearch Query Language (ES|QL) 
// data that is used in the visual composer application.

interface BaseESQLBlock {
  command: string;
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
  fields: { [oldName: string]: string };
}

export interface WhereBlock extends BaseESQLBlock {
  command: "WHERE";
  filter: string;
}

export interface SortBlock extends BaseESQLBlock {
  command: "SORT";
  fields: { name: string; asc: boolean }[];
}

export type ESQLBlock =
  | LimitBlock
  | KeepBlock
  | DropBlock
  | RenameBlock
  | WhereBlock
  | SortBlock;

const BACKTICK = "`";

// https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-syntax.html
const escape = (name: string): string => {
    if (!/^[a-zA-Z_@]/.test(name) || /[^a-zA-Z0-9_]/.test(name.slice(1))) {
        return `${BACKTICK}${name.replace(BACKTICK, BACKTICK + BACKTICK)}${BACKTICK}`;
    }
    return name;
};

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
  if (Object.keys(block.fields).length === 0) {
    return null;
  }
  const fields = Object.entries(block.fields)
    .map(
      ([oldName, newName]) =>
        `${escape(oldName)} AS ${escape(newName)}`
    )
    .join(", ");
  return `RENAME ${fields}`;
};

const whereBlockToString = (block: WhereBlock): string | null => {
  if (block.filter === "" || block.filter === null) {
    return null;
  }
  return `WHERE ${block.filter}`;
};

const sortBlockToString = (block: SortBlock): string | null => {
  if (block.fields.length === 0) {
    return null;
  }
  const fields = block.fields
    .map((field) => `${escape(field.name)}${field.asc ? "" : " DESC"}`)
    .join(", ");
  return `SORT ${fields}`;
};

const esqlBlockToString = (block: ESQLBlock): string | null => {
  switch (block.command) {
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

export type ESQLChain = ESQLBlock[];

export const esqlChainToString = (chain: ESQLChain) : string => {
    return chain
        .map(esqlBlockToString)
        .filter((block) => block !== null)
        .join("\n| ");
}

interface ESQLChainSimpleAction {
    action: "keep";
};

interface ESQLFieldBaseAction {
    action: string
    field: string;
}

interface ESQLFieldSimpleAction extends ESQLFieldBaseAction {
    action: "drop" | "sortAsc" | "sortDesc" | "filter";
}

interface ESQLFieldRenameAction extends ESQLFieldBaseAction {
    action: "rename";
    newName: string;
}

export type ESQLFieldAction = ESQLFieldSimpleAction | ESQLFieldRenameAction;

export type ESQLChainAction = ESQLChainSimpleAction | ESQLFieldAction;

export const performChainAction = (chain: ESQLChain, action: ESQLChainAction): ESQLChain => {
    switch (action.action) {
        case "keep":
            return [...chain, { command: "KEEP", fields: [] }];
        case "drop":
            return [...chain, { command: "DROP", fields: [action.field] }];
        case "sortAsc":
            return [...chain, { command: "SORT", fields: [{ name: action.field, asc: true }] }];
        case "sortDesc":
            return [...chain, { command: "SORT", fields: [{ name: action.field, asc: false }] }];
        case "filter":
            return [...chain, { command: "WHERE", filter: action.field }];
        case "rename":
            return [...chain, { command: "RENAME", fields: { [action.field]: action.newName } }];
    }
};