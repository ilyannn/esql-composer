import React from "react";
import {
  ESQLAtomValue,
  esqlRepresentation,
  ESQLSentinelOtherValues,
  ESQLValueFalse,
  ESQLValueNull,
  ESQLValueTrue,
} from "../../../models/esql/esql_types";
import { Text } from "@chakra-ui/react";

interface FieldValueProps {
  value: ESQLAtomValue | typeof ESQLSentinelOtherValues;
}

const getColor = (
  val: ESQLAtomValue | typeof ESQLSentinelOtherValues
): string => {
  if (typeof val === "string") return "green";
  if (typeof val === "number") return "blue";
  if (val === ESQLValueFalse || val === ESQLValueTrue) return "orange";
  if (val === ESQLValueNull) return "red";
  return "black";
};

const getFontStyle = (
  val: ESQLAtomValue | typeof ESQLSentinelOtherValues
): string => {
  if (typeof val === "string") return "oblique";
  if (typeof val === "number") return "normal";
  if (val === ESQLValueFalse || val === ESQLValueTrue) return "italic";
  if (val === ESQLValueNull) return "normal";
  return "normal";
};

const FieldValue: React.FC<FieldValueProps> = ({ value }) => {
  return (
    <Text color={getColor(value)} fontStyle={getFontStyle(value)}>
      {typeof value === "string"
        ? value
        : value === ESQLSentinelOtherValues
        ? "Other Values"
        : esqlRepresentation(value)}
    </Text>
  );
};

export default FieldValue;
