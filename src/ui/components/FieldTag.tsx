import { Tag, TagLabel } from "@chakra-ui/react";
import React from "react";

export const FieldTag: React.FC<{
  name: string;
  size?: "md" | "lg" | "sm";
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ name, size = "md", children, disabled = false, onClick }) => (
  <Tag size={size} variant="outline" 
  colorScheme={disabled ? "gray" : "teal"}
  opacity={disabled ? 0.5 : 1}
  onClick={onClick}
  >
    <TagLabel>{name}</TagLabel>
    {children}
  </Tag>
);

export default FieldTag;
