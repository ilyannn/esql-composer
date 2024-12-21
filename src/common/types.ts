import { StreamingStats } from "../services/llm/adapters/types";

export interface LLMStatisticsRow extends StreamingStats {
  esql_time_ms: number | undefined;
}

export interface LLMHistoryRow {
  text: string;
  esqlInput: string;
  esql: string;
  stats: LLMStatisticsRow;
}
