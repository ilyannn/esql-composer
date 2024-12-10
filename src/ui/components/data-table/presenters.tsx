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
import { Box, Code, Link } from "@chakra-ui/react";

import Highlight from "react-highlight";
import "@highlightjs/cdn-assets/styles/nnfx-light.css";
import "./highlight-esql.css";
require("../../../services/highlight-esql.js");

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
  typeof value === "string" ? (
    <Box display={"block"} borderLeft="2px dotted gray" paddingLeft="1em">
      <Markdown
        components={{
          h1(props) {
            const { node, ...rest } = props;
            return (
              <>
                <b
                  style={{
                    fontSize: "1.2em",
                  }}
                  {...rest}
                />
                <br />
              </>
            );
          },
          h2: "b",
          h3(props) {
            const { node, ...rest } = props;
            return (
              <>
                <i>
                  <b style={{ opacity: 0.75 }} {...rest} />
                </i>
                <br />
              </>
            );
          },
          h4: "em",
        }}
      >
        {value}
      </Markdown>
    </Box>
  ) : (
    defaultPresenter(value)
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

const esqlPresenter: Presenter = (value: ESQLAtomValue) => {
  if (typeof value === "string") {
    return <Highlight className="language-esql">{value}</Highlight>;
  }

  return defaultPresenter(value);
};

const urlPresenter: Presenter = (value: ESQLAtomValue) => {
  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <Link href="value" isExternal>
        {value}
      </Link>
    );
  }

  return defaultPresenter(value);
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

    if (class_ === "stringy" && column.name.endsWith("(ES|QL)")) {
      return esqlPresenter;
    }

    if (class_ === "stringy" && column.name.endsWith("(URL)")) {
      return urlPresenter;
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
