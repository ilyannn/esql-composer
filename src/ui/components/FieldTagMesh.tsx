import { HStack, Wrap, WrapItem } from "@chakra-ui/react";
import { FieldTag } from "./FieldTag";
import { useCallback, useState } from "react";

interface FieldTagMeshProps {
  size: "md" | "lg" | "sm";
  fields: string[];
  setFields?: (fields: string[]) => void;
}

export function FieldTagMesh({ size, fields, setFields }: FieldTagMeshProps) {
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [draggedFieldWidth, setDraggedFieldWidth] = useState<number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveFieldToIndex = useCallback(
    (field: string, newFieldIndex: number) => {
      const updatedFields = [...fields.filter((f) => f !== field)];
      updatedFields.splice(newFieldIndex, 0, field);
      if (setFields) {
        setFields(updatedFields);
      }
    },
    [fields, setFields]
  );

  return (
    <Wrap
      spacing={size === "lg" ? 3 : 2}
      onDrop={(e) => {
        e.preventDefault();
        if (draggedField !== null && dragOverIndex !== null) {
          moveFieldToIndex(draggedField, dragOverIndex);
        }
      }}
    >
      {fields.map((name, fieldIndex) => (
        <WrapItem
          key={name}
          style={{ cursor: "grab", opacity: draggedField === name ? 0.5 : 1 }}
          draggable={setFields !== undefined}
          onDragStart={(e) => {
            e.currentTarget.style.cursor = "grabbing";
            setDraggedField(name);
            setDraggedFieldWidth(e.currentTarget.clientWidth);
          }}
          onDragEnter={(e) => {
            if (name !== draggedField) {
              setDragOverIndex(fieldIndex);
            } else {
              setDragOverIndex(null);
            }
          }}
          onDragExit={(e) => {
            // if (fieldIndex === dragOverIndex) {
            //   setDragOverIndex(null);
            // }
          }}
          onDragEnd={(e) => {
            setDraggedField(null);
            setDragOverIndex(null);
            e.currentTarget.style.cursor = "grab";
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
        >
          <HStack
            pl={
              draggedFieldWidth && dragOverIndex === fieldIndex
                ? draggedFieldWidth / 2
                : 0
            }
            pr={
              draggedFieldWidth && dragOverIndex === fieldIndex + 1
                ? draggedFieldWidth / 2
                : 0
            }
          >
            <FieldTag name={name} size={size} />
          </HStack>
        </WrapItem>
      ))}
    </Wrap>
  );
}
