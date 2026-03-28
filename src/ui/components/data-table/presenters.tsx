import { Box, Link } from "@chakra-ui/react";
import { JSX, Suspense, lazy } from "react";
import Markdown from "react-markdown";
import {
  ESQLAtomValue,
  esqlTypeToClass,
  type ESQLColumn,
} from "../../../models/esql/esql_types";
import FieldValue from "./FieldValue";
import { GeoPointFormatter } from "./geoPointFormatter";

const LazyWktRenderer = lazy(() =>
  import("./WktRenderer").then((module) => ({
    default: module.WktRenderer,
  })),
);
const LazyESQLCodeBlock = lazy(() => import("./ESQLCodeBlock"));

export type Presenter = (value: ESQLAtomValue) => JSX.Element;

const defaultPresenter: Presenter = (value: ESQLAtomValue) => (
  <FieldValue value={value} />
);

const createNumberPresenter = (
  maximumFractionDigits: number | undefined,
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

const geoShapePresenter: Presenter = (value: ESQLAtomValue) => {
  if (typeof value === "string") {
    return (
      <Suspense fallback={<FieldValue value={value} />}>
        <LazyWktRenderer wkt={value} />
      </Suspense>
    );
  }

  return <FieldValue value={value} />;
};

const esqlPresenter: Presenter = (value: ESQLAtomValue) => {
  if (typeof value === "string") {
    return (
      <Suspense fallback={<FieldValue value={value} />}>
        <LazyESQLCodeBlock value={value} />
      </Suspense>
    );
  }

  return defaultPresenter(value);
};

const urlPresenter: Presenter = (value: ESQLAtomValue) => {
  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <Link href={value} isExternal>
        {value}
      </Link>
    );
  }

  return defaultPresenter(value);
};

const colorPresenter = (value: ESQLAtomValue) => {
  if (typeof value === "string" && CSS.supports("color", value)) {
    return (
      <Box
        width="32px"
        height="32px"
        borderRadius="6px"
        boxShadow="inset 0 0 0 2px rgba(0, 0, 0, 0.2)"
        backgroundColor={value}
      />
    );
  }

  return defaultPresenter(value);
};

const datePresenterCache = new Map<string | undefined, Presenter>();
const moneyPresenterCache = new Map<string, Presenter>();
const numberPresenterCache = new Map<number | undefined, Presenter>();
const markdownPresenter = createMarkdownPresenter();

const getDatePresenter = (timezone: string | undefined): Presenter => {
  const existingPresenter = datePresenterCache.get(timezone);
  if (existingPresenter) {
    return existingPresenter;
  }

  const newPresenter = createDatePresenter(timezone);
  datePresenterCache.set(timezone, newPresenter);
  return newPresenter;
};

const getMoneyPresenter = (currency: string): Presenter => {
  const existingPresenter = moneyPresenterCache.get(currency);
  if (existingPresenter) {
    return existingPresenter;
  }

  const newPresenter = createMoneyPresenter(currency);
  moneyPresenterCache.set(currency, newPresenter);
  return newPresenter;
};

const getNumberPresenter = (
  maximumFractionDigits: number | undefined,
): Presenter => {
  const existingPresenter = numberPresenterCache.get(maximumFractionDigits);
  if (existingPresenter) {
    return existingPresenter;
  }

  const newPresenter = createNumberPresenter(maximumFractionDigits);
  numberPresenterCache.set(maximumFractionDigits, newPresenter);
  return newPresenter;
};

export const getPresenter = (column: ESQLColumn): Presenter => {
  try {
    if (column.name.endsWith("(UTC)")) {
      return getDatePresenter("UTC");
    }

    const timezoneMatch = column.name.match(/\b([A-Za-z_]+\/[A-Za-z_]+)\b/);
    if (timezoneMatch) {
      return getDatePresenter(timezoneMatch[1]);
    }

    if (
      column.type === "date" ||
      column.type === "date_nanos" ||
      column.name.endsWith("(Date)")
    ) {
      return getDatePresenter(undefined);
    }

    if (column.type === "geo_shape" || column.name.endsWith("(Shape)")) {
      return geoShapePresenter;
    }

    if (column.type === "geo_point") {
      return geoPointPresenter;
    }

    const class_ = esqlTypeToClass(column.type);

    if (class_ === "stringy" && column.name.endsWith("(Markdown)")) {
      return markdownPresenter;
    }

    if (class_ === "stringy" && column.name.endsWith("(ES|QL)")) {
      return esqlPresenter;
    }

    if (class_ === "stringy" && column.name.endsWith("(URL)")) {
      return urlPresenter;
    }

    if (class_ === "stringy" && column.name.endsWith("(Color)")) {
      return colorPresenter;
    }

    const currencyMatch = column.name.match(/\(([A-Z][A-Z][A-Z])\)$/);
    if (currencyMatch) {
      return getMoneyPresenter(currencyMatch[1]);
    }

    if (class_ === "numeric") {
      return getNumberPresenter(undefined);
    }
  } catch (e) {
    console.error("Failed to create presenter for ", column, e);
  }

  return defaultPresenter;
};
