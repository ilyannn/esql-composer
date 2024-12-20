

export interface StreamingStats {
  model: string;
  token_counts: {
    input_cached: number;
    input_uncached: number;
    saved_to_cache: number;
    output: number;
  };
  first_token_time_ms: number;
  total_time_ms: number;
}

export interface LLMStatisticsRow extends StreamingStats {
  esql_time_ms: number;
};

export interface LLMHistoryRow {
  text: string;
  esqlInput: string;
  esql: string;
  stats: LLMStatisticsRow;
};
