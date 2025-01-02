import {
  Button,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  Tooltip,
} from "@chakra-ui/react";
import React from "react";

import { LLMStatisticsRow } from "@/common/types";
import { downloadFile } from "@/services/browser";

interface StatisticsProps {
  tooltipsShown: boolean;
  stats: Array<LLMStatisticsRow>;
}

const downloadStatistics = (stats: Array<LLMStatisticsRow>) => {
  const csvContent = [
    [
      "TTFT",
      "ESQL Time",
      "Total Time",
      "Uncached",
      "From Cache",
      "To Cache",
      "Output",
      "Model",
    ],
    ...stats.map((stat) => [
      stat.first_token_time_ms,
      stat.esql_time_ms,
      stat.total_time_ms,
      stat.token_counts.input_uncached,
      stat.token_counts.input_cached,
      stat.token_counts.saved_to_cache,
      stat.token_counts.output,
      stat.model,
    ]),
  ]
    .map((e) => e.join(","))
    .join("\n");

  downloadFile(
    new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
    "statistics.csv",
  );
};

const Statistics: React.FC<StatisticsProps> = React.memo(
  ({ tooltipsShown, stats }) => {
    if (stats.length === 0) {
      return null;
    }

    const stat = stats[stats.length - 1];

    return (
      <StatGroup>
        <Tooltip isDisabled={!tooltipsShown} label="Time to first output token">
          <Stat>
            <StatLabel>TTFT</StatLabel>
            {stat.first_token_time_ms !== undefined && (
              <StatNumber>{stat.first_token_time_ms}ms</StatNumber>
            )}
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Time to complete ES|QL generation"
        >
          <Stat>
            <StatLabel>ES|QL Time</StatLabel>
            {stat.esql_time_ms !== undefined && (
              <StatNumber>{stat.esql_time_ms}ms</StatNumber>
            )}
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Total time the request has taken"
        >
          <Stat>
            <StatLabel>Total Time</StatLabel>
            {stat.total_time_ms !== undefined && (
              <StatNumber>{stat.total_time_ms}ms</StatNumber>
            )}
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Input tokens not read from the cache"
        >
          <Stat>
            <StatLabel>Uncached</StatLabel>
            {stat.token_counts.input_uncached !== undefined && (
              <StatNumber>{stat.token_counts.input_uncached}</StatNumber>
            )}
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Input tokens read from the cache"
        >
          <Stat>
            <StatLabel>Cache →</StatLabel>
            {stat.token_counts.input_cached !== undefined && (
              <StatNumber>{stat.token_counts.input_cached}</StatNumber>
            )}
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Input tokens saved to cache"
        >
          <Stat>
            <StatLabel>→ Cache</StatLabel>
            {stat.token_counts.saved_to_cache !== undefined && (
              <StatNumber>{stat.token_counts.saved_to_cache}</StatNumber>
            )}
          </Stat>
        </Tooltip>
        <Tooltip isDisabled={!tooltipsShown} label="Output tokens">
          <Stat>
            <StatLabel>Output</StatLabel>
            {stat.token_counts.output !== undefined && (
              <StatNumber>{stat.token_counts.output}</StatNumber>
            )}
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Download all statistics in CSV format"
        >
          <Button
            variant="ghost"
            colorScheme="green"
            onClick={() => downloadStatistics(stats)}
          >
            .csv
          </Button>
        </Tooltip>
      </StatGroup>
    );
  },
);

export default Statistics;
