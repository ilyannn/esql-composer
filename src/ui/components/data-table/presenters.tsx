import { JSX } from "react";
import {
  ESQLAtomValue,
  esqlTypeToClass,
  type ESQLColumn,
} from "../../../models/esql/esql_types";
import FieldValue from "./FieldValue";
import { GeoPointFormatter } from "./geoPointFormatter";

export type Presenter = (value: ESQLAtomValue) => JSX.Element;

const defaultPresenter: Presenter = (value: ESQLAtomValue) => (
  <FieldValue value={value} />
);

const numberPresenter = (
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

const datePresenter = (timezone: string | undefined): Presenter => {
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

const moneyPresenter = (currency: string): Presenter => {
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

const getPresenter = (column: ESQLColumn): Presenter => {
  try {
    if (column.name.endsWith("(UTC)")) {
      return datePresenter("UTC");
    }

    const timezoneMatch = column.name.match(/\b([A-Za-z_]+\/[A-Za-z_]+)\b/);
    if (timezoneMatch) {
      return datePresenter(timezoneMatch[1]);
    }

    if (
      column.type === "date" ||
      column.type === "date_nanos" ||
      column.name.endsWith("(Date)")
    ) {
      return datePresenter(undefined);
    }

    if (column.type === "geo_point") {
      return geoPointPresenter;
    }

    const currencyMatch = column.name.match(/\(([A-Z][A-Z][A-Z])\)$/);
    if (currencyMatch) {
      return moneyPresenter(currencyMatch[1]);
    }

    if (esqlTypeToClass(column.type) === "numeric") {
      return numberPresenter(undefined);
    }
  } catch (e) {
    console.error("Failed to create presenter for ", column, e);
  }

  return defaultPresenter;
};

export const createPresenters = (columns: ESQLColumn[]): Presenter[] => {
  return columns.map(getPresenter);
};
