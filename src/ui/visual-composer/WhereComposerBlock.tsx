import React, { useRef, useState } from "react";
import {
  CheckboxGroup,
  VStack,
  HStack,
  Heading,
  Input,
  InputRightElement,
  IconButton,
  Button,
  Spacer,
  Wrap,
  WrapItem,
  InputGroup,
} from "@chakra-ui/react";
import { CiUndo } from "react-icons/ci";
import FieldTag from "../components/atoms/FieldTag";
import SpinningButton from "../components/SpinningButton";
import FilterValueCheckbox from "../components/FilterValueCheckbox";
import { ESQLSentinelOtherValues } from "../../models/esql/esql_types";
import {
  ESQLBlock,
  FilterBlock,
  MatchBlock,
} from "../../models/esql/ESQLBlock";
import { set } from "lodash";

interface WhereComposerBlockProps {
  block: FilterBlock | MatchBlock;
  updateBlock: (block: ESQLBlock) => void;
  handleWhereTopStats: (count: number) => Promise<void>;
}

const WhereComposerBlock = ({
  block,
  updateBlock,
  handleWhereTopStats,
}: WhereComposerBlockProps) => {
  const isMatchBlock = "match" in block;
  const isValuesBlock = "values" in block;

  const inputRef = useRef<HTMLInputElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);

  const [inputValue, setInputValue] = useState<string>(
    isMatchBlock ? block.match : "",
  );

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (inputRef.current && e.relatedTarget !== undoButtonRef.current) {
      setInputValue(inputRef.current.value);
      updateBlock({
        ...block,
        match: inputRef.current.value,
      });
    }
  };

  return (
    <CheckboxGroup colorScheme="blackAlpha">
      <VStack spacing={3} align={"stretch"} justify={"stretch"}>
        <HStack spacing={5} align="baseline" justify={"flex-start"}>
          <FieldTag size="lg" name={block.field.name} />
          {isMatchBlock && (
            <Heading as="h4" size={"sm"}>
              :
            </Heading>
          )}
          {isMatchBlock && (
            <InputGroup onBlur={handleBlur}>
              <Input
                ref={inputRef}
                value={inputValue}
                onInput={(e) => setInputValue(e.currentTarget.value)}
                onKeyDown={(e) => {
                  setInputValue(e.currentTarget.value);
                  if (e.key === "Enter") {
                    updateBlock({
                      ...block,
                      match: e.currentTarget.value,
                    });
                  }
                }}
              ></Input>
              {inputValue !== block.match && (
                <InputRightElement>
                  <IconButton
                    ref={undoButtonRef}
                    aria-label="Undo"
                    icon={<CiUndo />}
                    onClick={(e) => {
                      setInputValue(block.match);
                    }}
                  />
                </InputRightElement>
              )}
            </InputGroup>
          )}
          {isValuesBlock && block.topStatsRetrieved === 0 && (
            <SpinningButton
              targets="es"
              type="submit"
              size="sm"
              spinningAction={() => handleWhereTopStats(10)}
            >
              Top 10
            </SpinningButton>
          )}
          <Spacer flex={2} />
          {isValuesBlock && (
            <Button
              variant={"ghost"}
              colorScheme="green"
              onClick={() =>
                updateBlock({
                  ...block,
                  values: block.values.map((f) => ({
                    ...f,
                    included: !f.included,
                  })),
                })
              }
            >
              Invert
            </Button>
          )}
        </HStack>

        {isValuesBlock && (
          <Wrap spacingX={6} align={"center"}>
            {block.values.map((v, valueIndex) => {
              return (
                <>
                  {valueIndex > 0 && block.topStatsRetrieved === valueIndex && (
                    <WrapItem key={"loading"}>
                      <SpinningButton
                        targets="es"
                        type="submit"
                        size="sm"
                        spinningAction={() =>
                          handleWhereTopStats(block.topStatsRetrieved + 10)
                        }
                      >
                        Get 10 More
                      </SpinningButton>
                    </WrapItem>
                  )}
                  {v.value === ESQLSentinelOtherValues && <Spacer />}
                  <WrapItem key={v.value.toString()}>
                    <FilterValueCheckbox
                      valueIndex={valueIndex}
                      block={block}
                      updateChecked={(newChecked) =>
                        updateBlock({
                          ...block,
                          values: block.values.map((f, i) =>
                            i === valueIndex
                              ? { ...f, included: newChecked }
                              : f,
                          ),
                        })
                      }
                    />
                  </WrapItem>
                </>
              );
            })}
            <WrapItem key="..."></WrapItem>
          </Wrap>
        )}
      </VStack>
    </CheckboxGroup>
  );
};

export default WhereComposerBlock;
