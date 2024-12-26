import React, { useCallback, useState } from "react";
import {
  Box,
  Checkbox,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  Text,
} from "@chakra-ui/react";

import { TracingOption } from "./types";

interface TracingCheckboxProps {
  children: React.ReactNode;
  option: TracingOption;
  setOption: (option: TracingOption) => void;
}

const TracingCheckbox: React.FC<TracingCheckboxProps> = ({
  children,
  option,
  setOption,
}) => {
  const setEnabled = useCallback(
    (enabled: boolean) => {
      setOption({ ...option, enabled });
    },
    [option, setOption]
  );

  const setIndexName = useCallback(
    (indexName: string) => {
      setOption({ ...option, indexName });
    },
    [option, setOption]
  );

  return (
    <HStack align="center" justify={"stretch"} h={5}>
      <Checkbox
        isChecked={option.enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      >
        {children}
      </Checkbox>
      {option.enabled && (
        <>
          <Text>→</Text>
          <Editable
            value={option.indexName}
            onChange={setIndexName}
            ml={2}
            pt={0.5}
          >
            <EditablePreview
              borderWidth={0}
              fontFamily={"monospace"}
              fontSize={16}
            />
            <EditableInput borderWidth={0} />
          </Editable>
        </>
      )}
    </HStack>
  );
};

export default TracingCheckbox;
