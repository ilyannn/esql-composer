
const BACKTICK = "`";

// https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-syntax.html
export const escape = (name: string): string => {
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
