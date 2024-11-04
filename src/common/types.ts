export type StatisticsRow = {
  first_token_time: number;
  esql_time: number;
  total_time: number;
  input_cached: number;
  input_uncached: number;
  saved_to_cache: number;
  output: number;
  model: string;
};

export type HistoryRow = {
  text: string;
  esqlInput: string;
  esql: string;
  stats: StatisticsRow;
};
