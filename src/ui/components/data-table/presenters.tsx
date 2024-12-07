import { JSX } from "react";
import {
  ESQLAtomValue,
  ESQLColumnType,
  esqlTypeToClass,
} from "../../../models/esql/esql_types";
import FieldValue from "./FieldValue";
import { type TableColumn } from "../../../services/es";
import { GeoPointFormatter } from "./geoPointFormatter";

export type Presenter = (value: ESQLAtomValue) => JSX.Element;

const IntlNumberFormatter = new Intl.NumberFormat();
const IntlDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

const DefaultPresenter: Presenter = (value: ESQLAtomValue) => (
  <FieldValue value={value} />
);

const NumberPresenter: Presenter = (value: ESQLAtomValue) => (
  <FieldValue
    value={value}
    formattedValue={
      typeof value === "number" ? IntlNumberFormatter.format(value) : undefined
    }
  />
);

const DatePresenter: Presenter = (value: ESQLAtomValue) => (
  <FieldValue
    value={value}
    formattedValue={
      typeof value === "string"
        ? IntlDateTimeFormatter.format(new Date(value))
        : undefined
    }
  />
);

const MoneyPresenter = (currency: string): Presenter => {
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

const GeoPointPresenter: Presenter = (value: ESQLAtomValue) => {
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

const getPresenter = (column: TableColumn): Presenter => {
  if (
    column.type === "date" ||
    column.type === "date_nanos" ||
    column.name.endsWith("(Date)")
  ) {
    return DatePresenter;
  }

  if (column.type === "geo_point") {
    return GeoPointPresenter;
  }

  const currencyMatch = column.name.match(/\(([A-Z][A-Z][A-Z])\)$/);
  if (currencyMatch) {
    return MoneyPresenter(currencyMatch[1]);
  }

  if (esqlTypeToClass(column.type) === "numeric") {
    return NumberPresenter;
  }

  return DefaultPresenter;
};

export const createPresenters = (columns: TableColumn[]): Presenter[] => {
  return columns.map(getPresenter);
};
