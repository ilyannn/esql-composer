import React from "react";
import {
  ESQLAtomValue,
  ESQLSentinelOtherValues,
  ESQLValueFalse,
  ESQLValueNull,
  ESQLValueTrue,
} from "../../../models/esql/esql_types";
import { representESQLValue } from "../../../models/esql/esql_repr";
import { Text } from "@chakra-ui/react";

interface FieldValueProps {
  value: ESQLAtomValue | typeof ESQLSentinelOtherValues;
  formattedValue?: string | undefined;
}

const getColor = (
  val: ESQLAtomValue | typeof ESQLSentinelOtherValues
): string => {
  if (typeof val === "string") return "green";
  if (typeof val === "number") return "blue";
  if (val === ESQLValueFalse || val === ESQLValueTrue) return "black";
  if (val === ESQLValueNull) return "red";
  return "black";
};

const getFontStyle = (
  val: ESQLAtomValue | typeof ESQLSentinelOtherValues
): string => {
  if (typeof val === "string") return "oblique";
  if (typeof val === "number") return "normal";
  if (val === ESQLValueFalse || val === ESQLValueTrue) return "normal";
  if (val === ESQLValueNull) return "normal";
  return "normal";
};

const FieldValue: React.FC<FieldValueProps> = ({
  value,
  formattedValue = undefined,
}) => {
  if (formattedValue !== undefined) {
    return <Text>{formattedValue}</Text>;
  }

  const stringToDisplay =
    value === ESQLSentinelOtherValues
      ? "Other Values"
      : typeof value === "string"
      ? value
      : representESQLValue(value);

  return (
    <Text color={getColor(value)} fontStyle={getFontStyle(value)}>
      {stringToDisplay}
    </Text>
  );
};

export default React.memo(FieldValue);
