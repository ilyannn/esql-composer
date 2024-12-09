import { memoize } from "lodash";
import { JSX } from "react";
import {
  ESQLAtomValue,
  esqlTypeToClass,
  type ESQLColumn,
} from "../../../models/esql/esql_types";
import FieldValue from "./FieldValue";
import { GeoPointFormatter } from "./geoPointFormatter";
import Markdown from "react-markdown";
import { Box } from "@chakra-ui/react";

export type Presenter = (value: ESQLAtomValue) => JSX.Element;

const defaultPresenter: Presenter = (value: ESQLAtomValue) => (
  <FieldValue value={value} />
);

const createNumberPresenter = (
  maximumFractionDigits: number | undefined
): Presenter => {
  const localNumberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  });

  return (value: ESQLAtomValue) => (
    <FieldValue
      value={value}
      formattedValue={
        typeof value === "number"
          ? localNumberFormatter.format(value)
          : undefined
      }
    />
  );
};

const createDatePresenter = (timezone: string | undefined): Presenter => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return (value: ESQLAtomValue) => (
    <FieldValue
      value={value}
      formattedValue={
        typeof value === "string"
          ? formatter.format(new Date(value))
          : undefined
      }
    />
  );
};

const createMoneyPresenter = (currency: string): Presenter => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  });

  return (value: ESQLAtomValue) => (
    <FieldValue
      value={value}
      formattedValue={
        typeof value === "number" ? formatter.format(value) : undefined
      }
    />
  );
};

const createMarkdownPresenter = (): Presenter => (value: ESQLAtomValue) =>
  (
    <Box display={"block"}>
      <Markdown components={{ h1: "b", h2: "b", h4: "em" }}>
        {value.toString()}
      </Markdown>
    </Box>
  );

const geoPointPresenter: Presenter = (value: ESQLAtomValue) => {
  let formattedValue: string | undefined = undefined;

  if (typeof value === "string" && value.startsWith("POINT")) {
    try {
      formattedValue = GeoPointFormatter.format(value);
    } catch (e) {
      console.error("Failed to parse geo_point", value, e);
    }
  }

  return <FieldValue value={value} formattedValue={formattedValue} />;
};

const memoizedCreateDatePresenter = memoize(createDatePresenter);
const memoizedCreateMoneyPresenter = memoize(createMoneyPresenter);
const memoizedCreateNumberPresenter = memoize(createNumberPresenter);
const memoizedCreateMarkdownPresenter = memoize(createMarkdownPresenter);

export const getPresenter = (column: ESQLColumn): Presenter => {
  try {
    if (column.name.endsWith("(UTC)")) {
      return memoizedCreateDatePresenter("UTC");
    }

    const timezoneMatch = column.name.match(/\b([A-Za-z_]+\/[A-Za-z_]+)\b/);
    if (timezoneMatch) {
      return memoizedCreateDatePresenter(timezoneMatch[1]);
    }

    if (
      column.type === "date" ||
      column.type === "date_nanos" ||
      column.name.endsWith("(Date)")
    ) {
      return memoizedCreateDatePresenter(undefined);
    }

    if (column.type === "geo_point") {
      return geoPointPresenter;
    }

    const class_ = esqlTypeToClass(column.type);

    if (class_ === "stringy" && column.name.endsWith("(Markdown)")) {
      return memoizedCreateMarkdownPresenter();
    }

    const currencyMatch = column.name.match(/\(([A-Z][A-Z][A-Z])\)$/);
    if (currencyMatch) {
      return memoizedCreateMoneyPresenter(currencyMatch[1]);
    }

    if (class_ === "numeric") {
      return memoizedCreateNumberPresenter(undefined);
    }
  } catch (e) {
    console.error("Failed to create presenter for ", column, e);
  }

  return defaultPresenter;
};
