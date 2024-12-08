import { escape } from "lodash";
import { TableColumn } from "../../services/es";
import { esqlRepresentation, esqlTypeToClass } from "./esql_types";

/**
 * Creates a SQL WHERE clause based on the provided parameters.
 *
 * @param defaultIncluded - A boolean indicating whether "by default" values are included.
 * @param specialValues - An array of special values whose 'included' status is opposite of defaultIncluded.
 * @param nullIsSpecial - A boolean indicating whether 'included' status of NULL is opposite of defaultIncluded.
 * @returns A string representing the main part of the SQL WHERE clause.
 */
interface WhereClauseParams {
  field: TableColumn;
  defaultIncluded: boolean;
  specialValues?: any[];
  nullIsSpecial?: boolean;
}

export const constructWhereClause = ({
  field,
  defaultIncluded,
  specialValues = [],
  nullIsSpecial = false,
}: WhereClauseParams): string => {
  // If defaultIncluded is true, the shape of the clause is '[true] and field != X and field != Y...'
  // If defaultIncluded is false, the shape of the clause is '[false] or field == X or field == Y...'
  const connector = defaultIncluded ? " AND " : " OR ";
  const escapedField = escape(field.name);
  const escapedValues = specialValues.map((v) =>
    esqlRepresentation(v, field.type)
  );

  let clauses: string[] = [];

  if (nullIsSpecial && defaultIncluded) {
    clauses.push(`${escapedField} IS NOT NULL`);
  }

  if (nullIsSpecial && !defaultIncluded) {
    clauses.push(`${escapedField} IS NULL`);
  }

  switch (esqlTypeToClass(field.type)) {
    case "geo":
      for (const escapedValue of escapedValues) {
        const geo_op = defaultIncluded ? "ST_DISJOINT" : "ST_WITHIN";
        clauses.push(`${geo_op}(${escapedField}, ${escapedValue})`);
      }
      break;

    case "boolean":
      for (const value of specialValues) {
        const bool_op = value === defaultIncluded ? "NOT " : "";
        clauses.push(`${bool_op}${escapedField}`);
      }
      break;

    default:
      if (specialValues.length <= 2) {
        const op = defaultIncluded ? "!=" : "==";
        for (const escapedValue of escapedValues) {
          clauses.push(`${escapedField} ${op} ${escapedValue}`);
        }
      } else {
        const op = defaultIncluded ? "NOT IN" : "IN";
        const expr = "(" + escapedValues.join(", ") + ")";
        clauses.push(`${escapedField} ${op} ${expr}`);
      }
      break;
  }

  if (clauses.length === 0) {
    return defaultIncluded.toString();
  }

  return clauses.join(connector);
};
