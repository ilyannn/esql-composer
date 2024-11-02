import {
  Button,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  Tooltip,
} from "@chakra-ui/react";
import React from "react";

import { StatisticsRow } from "../../common/types";

interface StatisticsProps {
  tooltipsShown: boolean;
  stats: Array<StatisticsRow>;
}

const downloadStatistics = (stats: Array<StatisticsRow>) => {
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
      stat.first_token_time,
      stat.esql_time,
      stat.total_time,
      stat.input_uncached,
      stat.input_cached,
      stat.saved_to_cache,
      stat.output,
      stat.model,
    ]),
  ]
    .map((e) => e.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "statistics.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
            <StatNumber>{stat.first_token_time}ms</StatNumber>
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Time to complete ES|QL generation"
        >
          <Stat>
            <StatLabel>ES|QL Time</StatLabel>
            <StatNumber>{stat.esql_time}ms</StatNumber>
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Total time the request has taken"
        >
          <Stat>
            <StatLabel>Total Time</StatLabel>
            <StatNumber>{stat.total_time}ms</StatNumber>
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Input tokens not read from the cache"
        >
          <Stat>
            <StatLabel>Uncached</StatLabel>
            <StatNumber>{stat.input_uncached}</StatNumber>
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Input tokens read from the cache"
        >
          <Stat>
            <StatLabel>Cache →</StatLabel>
            <StatNumber>{stat.input_cached}</StatNumber>
          </Stat>
        </Tooltip>
        <Tooltip
          isDisabled={!tooltipsShown}
          label="Input tokens saved to cache"
        >
          <Stat>
            <StatLabel>→ Cache</StatLabel>
            <StatNumber>{stat.saved_to_cache}</StatNumber>
          </Stat>
        </Tooltip>
        <Tooltip isDisabled={!tooltipsShown} label="Output tokens">
          <Stat>
            <StatLabel>Output</StatLabel>
            <StatNumber>{stat.output}</StatNumber>
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
  }
);

export default Statistics;
