import { Wrap, WrapItem } from "@chakra-ui/react";
import { FieldTag } from "./FieldTag";
import { useCallback } from "react";

interface FieldTagMeshProps {
  size: "md" | "lg" | "sm";
  fields: string[];
  setFields: (fields: string[]) => void;
}

export function FieldTagMesh({ size, fields, setFields }: FieldTagMeshProps) {

    const moveFieldToIndex = useCallback(
    (field: string, newFieldIndex: number) => {
      const updatedFields = [...fields.filter((f) => f !== field)];
      updatedFields.splice(newFieldIndex, 0, field);
      setFields(updatedFields);
    },
    [fields, setFields]
  );

  return (
    <Wrap spacing={size === "lg" ? 3 : 2}>
      {fields.map((name, fieldIndex) => (
        <WrapItem
          key={name}
          style={{ cursor: "grab" }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", name);
            e.currentTarget.style.cursor = "grabbing";
          }}
          onDragEnter={(e) => {
            e.currentTarget.style.opacity = "0.25";
          }}
          onDragExit={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onDragEnd={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.cursor = "grab";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedField = e.dataTransfer.getData("text/plain");
            moveFieldToIndex(draggedField, fieldIndex);
            e.currentTarget.style.opacity = "1";
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <FieldTag name={name} size={size} />
        </WrapItem>
      ))}
    </Wrap>
  );
}
