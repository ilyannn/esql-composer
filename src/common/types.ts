export type LLMStatisticsRow = {
  first_token_time_ms: number;
  esql_time_ms: number;
  total_time_ms: number;
  token_counts: {
    input_cached: number;
    input_uncached: number;
    saved_to_cache: number;
    output: number;
  }
  model: string;
};

export type LLMHistoryRow = {
  text: string;
  esqlInput: string;
  esql: string;
  stats: LLMStatisticsRow;
};
